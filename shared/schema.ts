import { sql } from "drizzle-orm";
import { pgTable, serial, text, json, timestamp, integer, boolean, varchar, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Таблиця рівнів гри
export const gameLevelsTable = pgTable("game_levels", {
  id: text("id").primaryKey(), // 'soul', 'mind', 'body'
  name: text("name").notNull(),
  description: text("description").notNull(),
  order: integer("order").notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Таблиця карток
export const gameCardsTable = pgTable("game_cards", {
  id: text("id").primaryKey(),
  levelId: text("level_id").notNull().references(() => gameLevelsTable.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description").notNull(),
  hint: text("hint"),
  type: text("type", { enum: ["text", "choice", "values", "reflection", "completion"] }).notNull(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull(),
  estimatedTime: integer("estimated_time").notNull(),
  required: boolean("required").notNull().default(true),
  positionX: integer("position_x").notNull(),
  positionY: integer("position_y").notNull(),
  validation: json("validation"), // Правила валідації
  rewards: json("rewards"), // XP, badges, unlocks
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Таблиця властивостей карток (опції для вибору)
export const cardPropertiesTable = pgTable("card_properties", {
  id: serial("id").primaryKey(),
  cardId: text("card_id").notNull().references(() => gameCardsTable.id),
  type: text("type", { enum: ["option", "next_card", "unlock_requirement"] }).notNull(),
  key: text("key").notNull(), // id опції або ключ властивості
  label: text("label"),
  icon: text("icon"),
  description: text("description"),
  value: json("value"), // Додаткові дані
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Таблиця зв'язків між картками
export const cardRelationsTable = pgTable("card_relations", {
  id: serial("id").primaryKey(),
  fromCardId: text("from_card_id").notNull().references(() => gameCardsTable.id),
  toCardId: text("to_card_id").notNull().references(() => gameCardsTable.id),
  relationType: text("relation_type", { enum: ["next", "unlock", "branch"] }).notNull(),
  condition: json("condition"), // Умови для переходу
  label: text("label"), // Назва переходу
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Таблиця ігрових сесій
export const gameSessionsTable = pgTable("game_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"), // Optional for anonymous sessions
  currentLevel: text("current_level", { enum: ["soul", "mind", "body"] }).notNull().default("soul"),
  currentCard: text("current_card").notNull().default("soul-start"),
  completedCards: json("completed_cards").notNull().default(sql`'[]'`),
  progress: integer("progress").notNull().default(0),
  totalXp: integer("total_xp").notNull().default(0),
  earnedBadges: json("earned_badges").notNull().default(sql`'[]'`),
  completed: timestamp("completed"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Таблиця відповідей на картки
export const cardResponsesTable = pgTable("card_responses", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").notNull().references(() => gameSessionsTable.id),
  cardId: text("card_id").notNull().references(() => gameCardsTable.id),
  response: json("response").notNull(), // Текст, вибір або масив значень
  responseType: text("response_type", { enum: ["text", "choice", "values"] }).notNull(),
  submittedAt: timestamp("submitted_at").default(sql`now()`).notNull(),
});

// Унікальний індекс для відповідей (одна відповідь на картку в сесії)
export const uniqueCardResponseIndex = pgTable("unique_card_response_idx", {
  sessionId: varchar("session_id").notNull(),
  cardId: text("card_id").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.sessionId, table.cardId] }),
}));

// Відношення між таблицями
export const gameLevelsRelations = relations(gameLevelsTable, ({ many }) => ({
  cards: many(gameCardsTable),
}));

export const gameCardsRelations = relations(gameCardsTable, ({ one, many }) => ({
  level: one(gameLevelsTable, {
    fields: [gameCardsTable.levelId],
    references: [gameLevelsTable.id],
  }),
  properties: many(cardPropertiesTable),
  responses: many(cardResponsesTable),
  outgoingRelations: many(cardRelationsTable, { relationName: "fromCard" }),
  incomingRelations: many(cardRelationsTable, { relationName: "toCard" }),
}));

export const cardPropertiesRelations = relations(cardPropertiesTable, ({ one }) => ({
  card: one(gameCardsTable, {
    fields: [cardPropertiesTable.cardId],
    references: [gameCardsTable.id],
  }),
}));

export const cardRelationsRelations = relations(cardRelationsTable, ({ one }) => ({
  fromCard: one(gameCardsTable, {
    fields: [cardRelationsTable.fromCardId],
    references: [gameCardsTable.id],
    relationName: "fromCard",
  }),
  toCard: one(gameCardsTable, {
    fields: [cardRelationsTable.toCardId],
    references: [gameCardsTable.id],
    relationName: "toCard",
  }),
}));

export const gameSessionsRelations = relations(gameSessionsTable, ({ many }) => ({
  responses: many(cardResponsesTable),
}));

export const cardResponsesRelations = relations(cardResponsesTable, ({ one }) => ({
  session: one(gameSessionsTable, {
    fields: [cardResponsesTable.sessionId],
    references: [gameSessionsTable.id],
  }),
  card: one(gameCardsTable, {
    fields: [cardResponsesTable.cardId],
    references: [gameCardsTable.id],
  }),
}));

// Zod схеми для валідації
export const insertGameLevelSchema = createInsertSchema(gameLevelsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertGameCardSchema = createInsertSchema(gameCardsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCardPropertySchema = createInsertSchema(cardPropertiesTable).omit({
  id: true,
  createdAt: true,
});

export const insertCardRelationSchema = createInsertSchema(cardRelationsTable).omit({
  id: true,
  createdAt: true,
});

export const insertGameSessionSchema = createInsertSchema(gameSessionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateGameSessionSchema = insertGameSessionSchema.partial();

export const insertCardResponseSchema = createInsertSchema(cardResponsesTable).omit({
  id: true,
  submittedAt: true,
});

// Типи для TypeScript
export type GameLevel = typeof gameLevelsTable.$inferSelect;
export type GameCard = typeof gameCardsTable.$inferSelect;
export type CardProperty = typeof cardPropertiesTable.$inferSelect;
export type CardRelation = typeof cardRelationsTable.$inferSelect;
export type GameSession = typeof gameSessionsTable.$inferSelect;
export type CardResponse = typeof cardResponsesTable.$inferSelect;

export type InsertGameLevel = z.infer<typeof insertGameLevelSchema>;
export type InsertGameCard = z.infer<typeof insertGameCardSchema>;
export type InsertCardProperty = z.infer<typeof insertCardPropertySchema>;
export type InsertCardRelation = z.infer<typeof insertCardRelationSchema>;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type UpdateGameSession = z.infer<typeof updateGameSessionSchema>;
export type InsertCardResponse = z.infer<typeof insertCardResponseSchema>;

// Legacy типи для сумісності з поточним кодом
export type GameLevel_Legacy = "soul" | "mind" | "body";

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