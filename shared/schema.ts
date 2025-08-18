import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const gameSessionsTable = pgTable("game_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"), // Optional for anonymous sessions
  currentLevel: text("current_level").notNull().default("soul"), // soul, mind, body
  currentCard: integer("current_card").notNull().default(1),
  responses: jsonb("responses").notNull().default({}), // Store all responses
  progress: integer("progress").notNull().default(0), // 0-100
  completed: timestamp("completed"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const insertGameSessionSchema = createInsertSchema(gameSessionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateGameSessionSchema = insertGameSessionSchema.partial();

export type GameSession = typeof gameSessionsTable.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type UpdateGameSession = z.infer<typeof updateGameSessionSchema>;

// Game data types
export interface CardResponse {
  cardId: string;
  level: string;
  responses: Record<string, any>;
  timestamp: string;
}

export interface BrandMap {
  soul: {
    mission?: string;
    values: string[];
    story?: string;
    purpose?: string;
  };
  mind: {
    targetAudience?: string;
    brandIdea?: string;
    promise?: string;
    archetype?: string;
    positioning?: string;
    uniqueValue?: string;
  };
  body: {
    products: string[];
    channels: string[];
    visualStyle?: string;
    toneOfVoice?: string;
    actions: string[];
    resources?: string[];
  };
}

export type GameLevel = "soul" | "mind" | "body";

export interface GameCard {
  id: string;
  level: GameLevel;
  order: number;
  title: string;
  description: string;
  hint?: string;
  type: "values" | "text" | "choice" | "reflection" | "archetype" | "audience";
  required: boolean;
  options?: Array<{
    id: string;
    label: string;
    icon?: string;
    description?: string;
  }>;
  validation?: {
    minSelections?: number;
    maxSelections?: number;
    minLength?: number;
    maxLength?: number;
  };
  nextCard?: string | ((responses: any) => string);
}
