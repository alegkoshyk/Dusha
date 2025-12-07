import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Determine which database to use based on environment
// In production deployment, use PRODUCTION_DATABASE_URL if available
const isProduction = process.env.NODE_ENV === 'production' || process.env.REPL_DEPLOYMENT === '1';
const databaseUrl = isProduction && process.env.PRODUCTION_DATABASE_URL 
  ? process.env.PRODUCTION_DATABASE_URL 
  : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log(`Database: Using ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} database`);

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });