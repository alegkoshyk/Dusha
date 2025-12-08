import type { Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { storage } from "./storage";
import { setUserInSession } from "./auth";
import crypto from "crypto";

// OAuth state management
const oauthStates = new Map<string, { provider: string; timestamp: number }>();

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

// Generate secure state
function generateState(provider: string): string {
  const state = crypto.randomBytes(32).toString('hex');
  oauthStates.set(state, { provider, timestamp: Date.now() });
  return state;
}

// Verify state
function verifyState(state: string, provider: string): boolean {
  const data = oauthStates.get(state);
  if (!data) return false;
  if (data.provider !== provider) return false;
  oauthStates.delete(state);
  return true;
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

    const state = generateState("google");
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

      if (!code || !state || !verifyState(state as string, "google")) {
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

      res.redirect("/dashboard");
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
    if (!clientId) {
      return res.status(500).json({ error: "Apple OAuth not configured" });
    }

    const state = generateState("apple");
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/auth/apple/callback`;

    const appleAuthUrl = new URL("https://appleid.apple.com/auth/authorize");
    appleAuthUrl.searchParams.set("client_id", clientId);
    appleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    appleAuthUrl.searchParams.set("response_type", "code id_token");
    appleAuthUrl.searchParams.set("scope", "name email");
    appleAuthUrl.searchParams.set("state", state);
    appleAuthUrl.searchParams.set("response_mode", "form_post");

    res.redirect(appleAuthUrl.toString());
  });

  // Apple OAuth callback (uses POST for form_post response mode)
  app.post("/api/auth/apple/callback", async (req: Request, res: Response) => {
    try {
      const { code, state, id_token, user: userJson, error } = req.body;

      if (error) {
        console.error("Apple OAuth error:", error);
        return res.redirect("/?error=apple_oauth_denied");
      }

      if (!code || !state || !verifyState(state, "apple")) {
        return res.redirect("/?error=invalid_state");
      }

      // Decode the ID token to get user info (Apple provides minimal info)
      let appleUser: any = {};
      if (id_token) {
        try {
          const payload = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString());
          appleUser.id = payload.sub;
          appleUser.email = payload.email;
        } catch (e) {
          console.error("Failed to decode Apple ID token:", e);
        }
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

      res.redirect("/dashboard");
    } catch (error) {
      console.error("Apple OAuth callback error:", error);
      res.redirect("/?error=oauth_failed");
    }
  });

  // Check OAuth providers availability
  app.get("/api/auth/providers", (req: Request, res: Response) => {
    res.json({
      google: !!process.env.GOOGLE_CLIENT_ID,
      apple: !!process.env.APPLE_CLIENT_ID,
      email: true,
    });
  });
}
