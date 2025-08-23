import { sql } from "drizzle-orm";
import { pgTable, serial, text, json, timestamp, integer, boolean, varchar, primaryKey, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Таблиця користувачів
export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100}),
  lastName: varchar("last_name", { length: 100}),
  avatar: text("avatar"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
}));

// Таблиця налаштувань користувача
export const userSettingsTable = pgTable("user_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  language: varchar("language", { length: 10 }).notNull().default("uk"),
  theme: varchar("theme", { length: 20 }).notNull().default("light"),
  notifications: json("notifications").notNull().default(sql`'{"email": true, "push": true}'`),
  gamePreferences: json("game_preferences").notNull().default(sql`'{}'`),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Таблиця брендів користувача (окремі ігри)
export const userBrandsTable = pgTable("user_brands", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  logo: text("logo"),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, archived, completed
  totalProgress: integer("total_progress").notNull().default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Таблиця персональної картки користувача
export const userProfilesTable = pgTable("user_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  bio: text("bio"),
  company: varchar("company", { length: 200 }),
  position: varchar("position", { length: 200 }),
  website: text("website"),
  socialLinks: json("social_links").default(sql`'{}'`),
  skills: json("skills").default(sql`'[]'`),
  interests: json("interests").default(sql`'[]'`),
  achievements: json("achievements").default(sql`'[]'`),
  totalXp: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Сесії аутентифікації
export const sessionsTable = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

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
  type: text("type", { enum: ["text", "choice", "values", "reflection", "completion", "archetype"] }).notNull(),
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
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").references(() => userBrandsTable.id, { onDelete: "cascade" }),
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
  sessionId: uuid("session_id").notNull().references(() => gameSessionsTable.id, { onDelete: "cascade" }),
  cardId: text("card_id").notNull().references(() => gameCardsTable.id),
  response: json("response").notNull(), // Текст, вибір або масив значень
  responseType: text("response_type", { enum: ["text", "choice", "values"] }).notNull(),
  submittedAt: timestamp("submitted_at").default(sql`now()`).notNull(),
  startedAt: timestamp("started_at").default(sql`now()`).notNull(), // Коли почалося проходження картки
  timeSpent: integer("time_spent"), // Час у секундах, витрачений на картку
  isWithinTimeLimit: boolean("is_within_time_limit").default(true), // Чи встигли в ліміт часу
  earnedXP: integer("earned_xp").default(0), // Фактично нараховані XP (з урахуванням таймера)
}, (table) => ({
  uniqueResponse: index("unique_card_response").on(table.sessionId, table.cardId),
}));

// Унікальний індекс для відповідей (одна відповідь на картку в сесії)
export const uniqueCardResponseIndex = pgTable("unique_card_response_idx", {
  sessionId: varchar("session_id").notNull(),
  cardId: text("card_id").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.sessionId, table.cardId] }),
}));

// Відношення між таблицями
export const usersRelations = relations(usersTable, ({ one, many }) => ({
  settings: one(userSettingsTable),
  profile: one(userProfilesTable),
  brands: many(userBrandsTable),
  gameSessions: many(gameSessionsTable),
}));

export const userSettingsRelations = relations(userSettingsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userSettingsTable.userId],
    references: [usersTable.id],
  }),
}));

export const userBrandsRelations = relations(userBrandsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [userBrandsTable.userId],
    references: [usersTable.id],
  }),
  sessions: many(gameSessionsTable),
}));

export const userProfilesRelations = relations(userProfilesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userProfilesTable.userId],
    references: [usersTable.id],
  }),
}));

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

export const gameSessionsRelations = relations(gameSessionsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [gameSessionsTable.userId],
    references: [usersTable.id],
  }),
  brand: one(userBrandsTable, {
    fields: [gameSessionsTable.brandId],
    references: [userBrandsTable.id],
  }),
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

// Zod схеми для валідації користувачів
export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const registerUserSchema = insertUserSchema.omit({
  passwordHash: true,
  isActive: true,
  lastLoginAt: true,
}).extend({
  password: z.string().min(8, "Пароль повинен містити мінімум 8 символів"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Паролі не співпадають",
  path: ["confirmPassword"],
});

export const loginUserSchema = z.object({
  email: z.string().email("Некоректна email адреса"),
  password: z.string().min(1, "Пароль обов'язковий"),
});

export const insertUserSettingsSchema = createInsertSchema(userSettingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserBrandSchema = createInsertSchema(userBrandsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Zod схеми для гри
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
}).extend({
  currentCard: z.string().optional(),
});

export const updateGameSessionSchema = insertGameSessionSchema.partial();

export const insertCardResponseSchema = createInsertSchema(cardResponsesTable).omit({
  id: true,
  submittedAt: true,
  startedAt: true,
}).extend({
  timeSpent: z.number().optional(),
  isWithinTimeLimit: z.boolean().optional(),
  earnedXP: z.number().optional(),
});

// Типи для користувачів
export type User = typeof usersTable.$inferSelect;
export type UserSettings = typeof userSettingsTable.$inferSelect;
export type UserBrand = typeof userBrandsTable.$inferSelect;
export type UserProfile = typeof userProfilesTable.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type InsertUserBrand = z.infer<typeof insertUserBrandSchema>;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

// Типи для гри
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