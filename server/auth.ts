import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";

const PgSession = connectPgSimple(session);

// Configure session middleware
export const sessionMiddleware = session({
  store: new PgSession({
    pool: pool,
    tableName: "sessions",
    createTableIfMissing: false,
  }),
  secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  name: "sessionId", // Explicit session name
  cookie: {
    secure: false, // Temporarily disable for development
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: "lax", // Add sameSite for better compatibility
  },
});

// Auth middleware to check if user is authenticated
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const session = req.session as any;
  
  console.log("Auth check - sessionID:", req.sessionID);
  console.log("Auth check - session user:", session?.user ? "exists" : "missing");
  
  if (!session?.user) {
    console.log("Auth failed - no user in session");
    return res.status(401).json({ 
      error: "Authentication required",
      message: "Потрібна аутентифікація для доступу до цього ресурсу"
    });
  }
  
  console.log("Auth success for user:", session.user.email);
  next();
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