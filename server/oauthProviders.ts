import type { Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { storage } from "./storage";
import { setUserInSession } from "./auth";
import crypto from "crypto";

// Generate Apple client secret (JWT signed with private key)
function generateAppleClientSecret(): string {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const clientId = process.env.APPLE_CLIENT_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY;

  if (!teamId || !keyId || !clientId || !privateKey) {
    throw new Error("Missing Apple OAuth configuration");
  }

  const now = Math.floor(Date.now() / 1000);
  const expiration = now + 86400 * 180; // 180 days

  // JWT Header
  const header = {
    alg: "ES256",
    kid: keyId,
    typ: "JWT"
  };

  // JWT Payload
  const payload = {
    iss: teamId,
    iat: now,
    exp: expiration,
    aud: "https://appleid.apple.com",
    sub: clientId
  };

  // Base64url encode
  const base64url = (data: object) => 
    Buffer.from(JSON.stringify(data)).toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const headerEncoded = base64url(header);
  const payloadEncoded = base64url(payload);
  const signingInput = `${headerEncoded}.${payloadEncoded}`;

  // Normalize private key format - handle various input formats
  let normalizedKey = privateKey
    .replace(/\\n/g, '\n')           // Replace literal \n
    .replace(/\\r\\n/g, '\n')        // Replace literal \r\n
    .replace(/-----BEGIN PRIVATE KEY----- /g, '-----BEGIN PRIVATE KEY-----\n')  // Fix space after header
    .replace(/ -----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----');     // Fix space before footer
  
  // If still no newlines in the key body, try to reconstruct proper format
  if (!normalizedKey.includes('\n')) {
    // Extract the base64 content and reformat
    const match = normalizedKey.match(/-----BEGIN PRIVATE KEY-----(.*?)-----END PRIVATE KEY-----/s);
    if (match) {
      const base64Content = match[1].replace(/\s+/g, '');
      // Split into 64-char lines
      const lines = base64Content.match(/.{1,64}/g) || [];
      normalizedKey = `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
    }
  }

  // Sign with ES256 (ECDSA with P-256 and SHA-256)
  const sign = crypto.createSign('SHA256');
  sign.update(signingInput);
  const signature = sign.sign(normalizedKey, 'base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${signingInput}.${signature}`;
}

// OAuth state management with nonce for extra security
const oauthStates = new Map<string, { provider: string; timestamp: number; nonce?: string }>();

// Clean up old states every hour
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(oauthStates.entries());
  for (const [state, data] of entries) {
    if (now - data.timestamp > 10 * 60 * 1000) { // 10 minutes
      oauthStates.delete(state);
    }
  }
}, 60 * 60 * 1000);

// Generate secure state with optional nonce
function generateState(provider: string, includeNonce: boolean = false): { state: string; nonce?: string } {
  const state = crypto.randomBytes(32).toString('hex');
  const nonce = includeNonce ? crypto.randomBytes(32).toString('hex') : undefined;
  oauthStates.set(state, { provider, timestamp: Date.now(), nonce });
  return { state, nonce };
}

// Verify state and get nonce
function verifyState(state: string, provider: string): { valid: boolean; nonce?: string } {
  const data = oauthStates.get(state);
  if (!data) return { valid: false };
  if (data.provider !== provider) return { valid: false };
  const nonce = data.nonce;
  oauthStates.delete(state);
  return { valid: true, nonce };
}

// Get base URL dynamically
function getBaseUrl(req: Request): string {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${protocol}://${host}`;
}

export function setupOAuthRoutes(app: Express) {
  // =====================================================
  // GOOGLE OAUTH
  // =====================================================
  
  // Initiate Google OAuth flow
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "Google OAuth not configured" });
    }

    const { state } = generateState("google");
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("state", state);
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "consent");

    res.redirect(googleAuthUrl.toString());
  });

  // Google OAuth callback
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        console.error("Google OAuth error:", error);
        return res.redirect("/?error=google_oauth_denied");
      }

      const stateResult = verifyState(state as string, "google");
      if (!code || !state || !stateResult.valid) {
        return res.redirect("/?error=invalid_state");
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return res.redirect("/?error=oauth_not_configured");
      }

      const baseUrl = getBaseUrl(req);
      const redirectUri = `${baseUrl}/api/auth/google/callback`;

      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        console.error("Google token error:", await tokenResponse.text());
        return res.redirect("/?error=token_exchange_failed");
      }

      const tokens = await tokenResponse.json();

      // Get user info
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userInfoResponse.ok) {
        return res.redirect("/?error=failed_to_get_user_info");
      }

      const googleUser = await userInfoResponse.json();

      // Find or create user
      let user = await storage.getUserByGoogleId(googleUser.id);
      
      if (!user && googleUser.email) {
        // Check if user exists with this email
        user = await storage.getUserByEmail(googleUser.email);
        if (user) {
          // Link Google account to existing user
          user = await storage.updateUser(user.id, {
            googleId: googleUser.id,
            avatar: user.avatar || googleUser.picture,
          });
        }
      }

      if (!user) {
        // Create new user
        user = await storage.createOAuthUser({
          email: googleUser.email,
          firstName: googleUser.given_name,
          lastName: googleUser.family_name,
          avatar: googleUser.picture,
          googleId: googleUser.id,
          authProvider: "google",
        });
      }

      // Set session
      setUserInSession(req, user);

      // Update last login
      await storage.updateUserLastLogin(user.id);

      // Generate auth token for reliable authentication after OAuth redirect
      const authToken = crypto.randomBytes(32).toString('hex');
      await storage.createAuthToken(user.id, authToken);

      // Explicitly save session before redirect (important for production)
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      console.log("Google OAuth success - session saved for user:", user.email);
      // Redirect with token for reliable auth pickup
      res.redirect(`/dashboard?auth_token=${authToken}`);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect("/?error=oauth_failed");
    }
  });

  // =====================================================
  // APPLE OAUTH
  // =====================================================

  // Initiate Apple OAuth flow
  app.get("/api/auth/apple", (req: Request, res: Response) => {
    const clientId = process.env.APPLE_CLIENT_ID;
    const teamId = process.env.APPLE_TEAM_ID;
    const keyId = process.env.APPLE_KEY_ID;
    const privateKey = process.env.APPLE_PRIVATE_KEY;
    
    console.log("Apple OAuth config check:", {
      hasClientId: !!clientId,
      hasTeamId: !!teamId,
      hasKeyId: !!keyId,
      hasPrivateKey: !!privateKey,
      privateKeyLength: privateKey?.length || 0
    });
    
    if (!clientId || !teamId || !keyId || !privateKey) {
      console.error("Apple OAuth missing config:", {
        clientId: clientId ? "present" : "MISSING",
        teamId: teamId ? "present" : "MISSING",
        keyId: keyId ? "present" : "MISSING",
        privateKey: privateKey ? "present" : "MISSING"
      });
      return res.redirect("/?error=apple_oauth_not_configured");
    }

    // Use nonce for extra security with Apple
    const { state, nonce } = generateState("apple", true);
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/auth/apple/callback`;

    const appleAuthUrl = new URL("https://appleid.apple.com/auth/authorize");
    appleAuthUrl.searchParams.set("client_id", clientId);
    appleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    appleAuthUrl.searchParams.set("response_type", "code");
    appleAuthUrl.searchParams.set("scope", "name email");
    appleAuthUrl.searchParams.set("state", state);
    appleAuthUrl.searchParams.set("response_mode", "form_post");
    if (nonce) {
      appleAuthUrl.searchParams.set("nonce", nonce);
    }

    res.redirect(appleAuthUrl.toString());
  });

  // Apple OAuth callback (uses POST for form_post response mode)
  app.post("/api/auth/apple/callback", async (req: Request, res: Response) => {
    console.log("=== APPLE OAUTH CALLBACK RECEIVED ===");
    console.log("Request body keys:", Object.keys(req.body || {}));
    console.log("Request headers origin:", req.headers.origin);
    console.log("Request protocol:", req.protocol);
    
    try {
      const { code, state, user: userJson, error } = req.body;
      
      console.log("Apple callback params:", {
        hasCode: !!code,
        hasState: !!state,
        hasUserJson: !!userJson,
        error: error || "none"
      });

      if (error) {
        console.error("Apple OAuth error:", error);
        return res.redirect("/?error=apple_oauth_denied");
      }

      const stateResult = verifyState(state, "apple");
      if (!code || !state || !stateResult.valid) {
        return res.redirect("/?error=invalid_state");
      }
      const expectedNonce = stateResult.nonce;

      const clientId = process.env.APPLE_CLIENT_ID;
      if (!clientId) {
        return res.redirect("/?error=oauth_not_configured");
      }
      
      // Generate client secret dynamically (Apple requires JWT signed with private key)
      let clientSecret: string;
      try {
        clientSecret = generateAppleClientSecret();
      } catch (e) {
        console.error("Failed to generate Apple client secret:", e);
        return res.redirect("/?error=oauth_not_configured");
      }

      const baseUrl = getBaseUrl(req);
      const redirectUri = `${baseUrl}/api/auth/apple/callback`;

      // Exchange authorization code for tokens (secure server-side exchange)
      const tokenResponse = await fetch("https://appleid.apple.com/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Apple token error response:", errorText);
        console.error("Apple token error status:", tokenResponse.status);
        console.error("Token request params:", {
          clientId,
          redirectUri,
          hasCode: !!code,
          clientSecretLength: clientSecret?.length
        });
        // Return the actual Apple error in URL for debugging
        try {
          const errorJson = JSON.parse(errorText);
          return res.redirect(`/?error=token_exchange_failed&apple_error=${encodeURIComponent(errorJson.error || 'unknown')}`);
        } catch {
          return res.redirect(`/?error=token_exchange_failed&details=${encodeURIComponent(errorText.substring(0, 100))}`);
        }
      }

      const tokens = await tokenResponse.json();
      
      // Decode the verified ID token from Apple's token response
      let appleUser: any = {};
      if (tokens.id_token) {
        try {
          // The id_token from Apple's token endpoint is signed and can be trusted
          // since it came directly from Apple's server in exchange for a valid code
          const payload = JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64').toString());
          
          // Validate essential claims
          if (payload.iss !== 'https://appleid.apple.com') {
            console.error("Invalid Apple ID token issuer");
            return res.redirect("/?error=invalid_token_issuer");
          }
          if (payload.aud !== clientId) {
            console.error("Invalid Apple ID token audience");
            return res.redirect("/?error=invalid_token_audience");
          }
          if (payload.exp * 1000 < Date.now()) {
            console.error("Apple ID token expired");
            return res.redirect("/?error=token_expired");
          }
          
          // Verify nonce if we sent one
          if (expectedNonce && payload.nonce !== expectedNonce) {
            console.error("Apple ID token nonce mismatch");
            return res.redirect("/?error=invalid_nonce");
          }
          
          appleUser.id = payload.sub;
          appleUser.email = payload.email;
          appleUser.emailVerified = payload.email_verified;
        } catch (e) {
          console.error("Failed to decode Apple ID token:", e);
          return res.redirect("/?error=invalid_token");
        }
      } else {
        return res.redirect("/?error=no_id_token");
      }

      // Apple provides user info only on first login
      if (userJson) {
        try {
          const userData = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
          appleUser.firstName = userData.name?.firstName;
          appleUser.lastName = userData.name?.lastName;
        } catch (e) {
          console.error("Failed to parse Apple user data:", e);
        }
      }

      if (!appleUser.id) {
        return res.redirect("/?error=apple_user_id_missing");
      }

      // Find or create user
      let user = await storage.getUserByAppleId(appleUser.id);
      
      if (!user && appleUser.email) {
        // Check if user exists with this email
        user = await storage.getUserByEmail(appleUser.email);
        if (user) {
          // Link Apple account to existing user
          user = await storage.updateUser(user.id, {
            appleId: appleUser.id,
          });
        }
      }

      if (!user) {
        // Create new user
        user = await storage.createOAuthUser({
          email: appleUser.email,
          firstName: appleUser.firstName,
          lastName: appleUser.lastName,
          appleId: appleUser.id,
          authProvider: "apple",
        });
      }

      // Set session
      setUserInSession(req, user);

      // Update last login
      await storage.updateUserLastLogin(user.id);

      // Generate auth token for reliable authentication after OAuth redirect
      const authToken = crypto.randomBytes(32).toString('hex');
      await storage.createAuthToken(user.id, authToken);

      // Explicitly save session before redirect (important for production)
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      console.log("Apple OAuth success - session saved for user:", user.email);
      console.log("Generated auth token length:", authToken.length);
      console.log("Redirecting to dashboard with token...");
      // Redirect with token for reliable auth pickup
      res.redirect(`/dashboard?auth_token=${authToken}`);
    } catch (error) {
      console.error("Apple OAuth callback error:", error);
      res.redirect("/?error=oauth_failed");
    }
  });

  // Check OAuth providers availability (with detailed Apple config check)
  app.get("/api/auth/providers", (req: Request, res: Response) => {
    const privateKey = process.env.APPLE_PRIVATE_KEY || "";
    const normalizedKey = privateKey.replace(/\\n/g, '\n');
    const teamId = process.env.APPLE_TEAM_ID || "";
    const keyId = process.env.APPLE_KEY_ID || "";
    const clientId = process.env.APPLE_CLIENT_ID || "";
    
    const appleConfig = {
      hasClientId: !!clientId,
      clientIdValue: clientId, // Show actual client ID for debugging
      hasTeamId: !!teamId,
      teamIdValue: teamId, // Show actual team ID for debugging
      hasKeyId: !!keyId,
      keyIdValue: keyId, // Show actual key ID for debugging
      hasPrivateKey: !!privateKey,
      privateKeyLength: privateKey.length,
      keyStartsWith: privateKey.substring(0, 30),
      keyHasBeginMarker: normalizedKey.includes('-----BEGIN PRIVATE KEY-----'),
      keyHasEndMarker: normalizedKey.includes('-----END PRIVATE KEY-----'),
    };
    
    // Test JWT generation
    let jwtTestResult = "not_tested";
    try {
      generateAppleClientSecret();
      jwtTestResult = "success";
    } catch (e: any) {
      jwtTestResult = `error: ${e.message}`;
    }
    
    const appleFullyConfigured = appleConfig.hasClientId && 
      appleConfig.hasTeamId && 
      appleConfig.hasKeyId && 
      appleConfig.hasPrivateKey;
    
    res.json({
      google: !!process.env.GOOGLE_CLIENT_ID,
      apple: appleFullyConfigured,
      appleConfig, // Detailed config status (no secrets exposed)
      jwtTestResult,
      email: true,
    });
  });
}
