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

// Game field and progression system
export interface GameField {
  id: string;
  name: string;
  description: string;
  levels: GameFieldLevel[];
}

export interface GameFieldLevel {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  position: { x: number; y: number };
  cards: string[]; // Card IDs in this level
  unlockRequirements?: {
    previousLevel?: string;
    cardsCompleted?: number;
    specificCards?: string[];
  };
}

// Enhanced game card with branching paths
export interface GameCard {
  id: string;
  level: GameLevel;
  position: { x: number; y: number }; // Position on the game field
  title: string;
  description: string;
  shortDescription?: string; // For mobile view
  hint?: string;
  illustration?: string; // SVG or image path
  type: "values" | "text" | "choice" | "reflection" | "archetype" | "audience" | "branching" | "mini-game";
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: number; // in minutes
  required: boolean;
  
  // Branching logic
  nextCards?: {
    condition?: string; // JS expression or rule
    cardId: string;
    label?: string;
  }[];
  
  // Unlock requirements
  unlockRequirements?: {
    previousCards?: string[];
    level?: GameLevel;
    responses?: Record<string, any>;
  };
  
  // Card parameters
  parameters?: {
    maxSelections?: number;
    minSelections?: number;
    maxLength?: number;
    minLength?: number;
    customValidation?: string;
  };
  
  options?: Array<{
    id: string;
    label: string;
    icon?: string;
    description?: string;
    color?: string;
    nextCard?: string; // For branching based on choice
  }>;
  
  validation?: {
    minSelections?: number;
    maxSelections?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customRule?: string;
  };
  
  // Rewards and achievements
  rewards?: {
    xp: number;
    badges?: string[];
    unlocks?: string[]; // Card IDs to unlock
  };
  
  // Mini-game specific properties
  miniGame?: {
    gameType: "quiz" | "drag-drop" | "card-matching" | "timeline" | "priority-ranking";
    config: Record<string, any>;
  };
}

// Game progress and player data
export interface PlayerProgress {
  sessionId: string;
  currentCard: string;
  completedCards: string[];
  unlockedCards: string[];
  responses: Record<string, any>;
  achievements: string[];
  totalXP: number;
  levelProgress: Record<GameLevel, number>;
}

// Game state management
export interface GameState {
  field: GameField;
  playerProgress: PlayerProgress;
  availableCards: GameCard[];
  currentLevel: GameLevel;
  isComplete: boolean;
}
