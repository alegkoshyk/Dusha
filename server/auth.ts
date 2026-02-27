import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";

const PgSession = connectPgSimple(session);

// Determine if running in production
const isProduction = process.env.NODE_ENV === 'production' || process.env.REPL_DEPLOYMENT === '1';

// Warn if SESSION_SECRET is using the insecure default
if (!process.env.SESSION_SECRET) {
  console.warn('[SECURITY] SESSION_SECRET is not set — using insecure default. Set a strong secret in environment variables.');
}

// Configure session middleware
export const sessionMiddleware = session({
  store: new PgSession({
    pool: pool,
    tableName: "sessions",
    createTableIfMissing: true, // Auto-create sessions table if missing
  }),
  secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
  resave: false,
  saveUninitialized: true, // Change to true for iPad compatibility
  name: "connect.sid", // Standard session name
  proxy: isProduction, // Trust proxy in production
  cookie: {
    secure: isProduction, // true for HTTPS in production
    httpOnly: true, // Prevent JavaScript access to cookies (XSS protection)
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: isProduction ? "none" : "lax", // "none" for production, "lax" for dev
    domain: undefined, // Let browser handle domain
  },
});

// Auth middleware to check if user is authenticated
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const session = req.session as any;
  const authToken = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-auth-token'];
  
  console.log("Auth check - sessionID:", req.sessionID);
  console.log("Auth check - session user:", session?.user ? "exists" : "missing");
  console.log("Auth check - auth token:", authToken ? "provided" : "missing");
  
  // First try session-based auth
  if (session?.user) {
    console.log("Auth success via session for user:", session.user.email);
    return next();
  }
  
  // Fallback to token-based auth for iPad compatibility
  if (authToken) {
    try {
      const { storage } = await import("./storage");
      const user = await storage.getUserByAuthToken(authToken);
      if (user) {
        console.log("Auth success via token for user:", user.email);
        // Set user in request for downstream use
        (req as any).user = user;
        return next();
      }
    } catch (error) {
      console.log("Token auth failed:", error);
    }
  }
  
  console.log("Auth failed - no valid session or token");
  return res.status(401).json({ 
    error: "Authentication required",
    message: "Потрібна аутентифікація для доступу до цього ресурсу"
  });
};

// Optional auth middleware - doesn't block if not authenticated
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  next();
};

// Get current user from session
export const getCurrentUser = (req: Request): User | null => {
  const session = req.session as any;
  return session?.user || null;
};

// Get current user from session or token (unified)
export const getCurrentUserUnified = (req: Request): User | null => {
  // Try session first
  const sessionUser = getCurrentUser(req);
  if (sessionUser) return sessionUser;
  
  // Try token auth user
  return (req as any).user || null;
};

// Set user in session
export const setUserInSession = (req: Request, user: User) => {
  const session = req.session as any;
  session.user = user;
};

// Clear user from session
export const clearUserFromSession = (req: Request) => {
  const session = req.session as any;
  if (session.user) {
    delete session.user;
  }
};

declare module "express-session" {
  interface SessionData {
    user?: User;
  }
}