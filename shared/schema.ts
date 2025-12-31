import { sql } from "drizzle-orm";
import { pgTable, serial, text, json, timestamp, integer, boolean, varchar, primaryKey, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Таблиця користувачів
export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  firstName: varchar("first_name", { length: 100}),
  lastName: varchar("last_name", { length: 100}),
  avatar: text("avatar"),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  googleId: varchar("google_id", { length: 255 }).unique(),
  appleId: varchar("apple_id", { length: 255 }).unique(),
  authProvider: varchar("auth_provider", { length: 50 }).default("email"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  googleIdIdx: index("users_google_id_idx").on(table.googleId),
  appleIdIdx: index("users_apple_id_idx").on(table.appleId),
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
  // Базова інформація
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  // Інформація про компанію (онбординг)
  company: varchar("company", { length: 200 }),
  position: varchar("position", { length: 200 }),
  industry: varchar("industry", { length: 100 }), // сфера діяльності
  employeeCount: varchar("employee_count", { length: 50 }), // кількість співробітників: "1", "2-10", "11-50", "51-200", "201-500", "500+"
  website: text("website"),
  // Соціальні посилання та навички
  socialLinks: json("social_links").default(sql`'{}'`),
  skills: json("skills").default(sql`'[]'`),
  interests: json("interests").default(sql`'[]'`),
  achievements: json("achievements").default(sql`'[]'`),
  // Гейміфікація
  totalXp: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  // Онбординг статус
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  onboardingSkipped: boolean("onboarding_skipped").notNull().default(false),
  // API ключі
  geminiApiKey: text("gemini_api_key"), // NanoBanana (Gemini) API key for image generation
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

// Типи карток з налаштуваннями
export const cardTypesTable = pgTable("card_types", {
  id: varchar("id", { length: 50 }).primaryKey(), // text, choice, values, archetype, etc.
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 10 }),
  color: varchar("color", { length: 20 }).notNull().default("blue"),
  validationRules: json("validation_rules").default(sql`'{}'`),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Попередньо заготовлені набори варіантів для карток (архетипи, цінності тощо)
export const cardOptionSetsTable = pgTable("card_option_sets", {
  id: varchar("id").primaryKey(), // зберігаємо існуючий тип
  name: varchar("name", { length: 100 }).notNull(), // "Архетипи бренду", "Базові цінності" тощо
  description: text("description"),
  minSelection: integer("min_selection").notNull().default(1),
  maxSelection: integer("max_selection").notNull().default(1),
  cardTypeId: varchar("card_type_id", { length: 50 }), // може бути null для загальних наборів
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Окремі варіанти в наборах
export const cardOptionsTable = pgTable("card_options", {
  id: varchar("id").primaryKey(), // зберігаємо існуючий тип
  optionSetId: varchar("option_set_id").notNull().references(() => cardOptionSetsTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  value: text("value").notNull(), // значення для зберігання в відповіді
  icon: varchar("icon", { length: 10 }), // емодзі або символ
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Зв'язок карток з наборами варіантів (яка картка використовує який набір)
export const cardOptionSetLinksTable = pgTable("card_option_set_links", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  cardId: text("card_id").notNull().references(() => gameCardsTable.id, { onDelete: "cascade" }),
  optionSetId: uuid("option_set_id").notNull().references(() => cardOptionSetsTable.id, { onDelete: "cascade" }),
  minSelections: integer("min_selections").notNull().default(1),
  maxSelections: integer("max_selections").notNull().default(1),
  isRequired: boolean("is_required").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Відношення для нових таблиць
export const cardTypesRelations = relations(cardTypesTable, ({ many }) => ({
  optionSets: many(cardOptionSetsTable),
}));

export const cardOptionSetsRelations = relations(cardOptionSetsTable, ({ one, many }) => ({
  cardType: one(cardTypesTable, {
    fields: [cardOptionSetsTable.cardTypeId],
    references: [cardTypesTable.id],
  }),
  options: many(cardOptionsTable),
  cardLinks: many(cardOptionSetLinksTable),
}));

export const cardOptionsRelations = relations(cardOptionsTable, ({ one }) => ({
  optionSet: one(cardOptionSetsTable, {
    fields: [cardOptionsTable.optionSetId],
    references: [cardOptionSetsTable.id],
  }),
}));

export const cardOptionSetLinksRelations = relations(cardOptionSetLinksTable, ({ one }) => ({
  card: one(gameCardsTable, {
    fields: [cardOptionSetLinksTable.cardId],
    references: [gameCardsTable.id],
  }),
  optionSet: one(cardOptionSetsTable, {
    fields: [cardOptionSetLinksTable.optionSetId],
    references: [cardOptionSetsTable.id],
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
  selectedPlanId: z.number().optional(),
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

// Типи для системи управління варіантами карток
export type CardType = typeof cardTypesTable.$inferSelect;
export type InsertCardType = typeof cardTypesTable.$inferInsert;
export type CardOptionSet = typeof cardOptionSetsTable.$inferSelect;
export type InsertCardOptionSet = typeof cardOptionSetsTable.$inferInsert;
export type CardOption = typeof cardOptionsTable.$inferSelect;
export type InsertCardOption = typeof cardOptionsTable.$inferInsert;
export type CardOptionSetLink = typeof cardOptionSetLinksTable.$inferSelect;
export type InsertCardOptionSetLink = typeof cardOptionSetLinksTable.$inferInsert;

// Таблиця налаштувань додатку (глобальні налаштування)
export const appSettingsTable = pgTable("app_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  isSecret: boolean("is_secret").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const insertAppSettingSchema = createInsertSchema(appSettingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AppSetting = typeof appSettingsTable.$inferSelect;
export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;

// Таблиця логів використання AI
export const aiUsageLogsTable = pgTable("ai_usage_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: varchar("provider", { length: 50 }).notNull(),
  model: varchar("model", { length: 100 }),
  tokensInput: integer("tokens_input"),
  tokensOutput: integer("tokens_output"),
  costEstimate: varchar("cost_estimate", { length: 20 }),
  sessionId: uuid("session_id"),
  userId: uuid("user_id"),
  endpoint: varchar("endpoint", { length: 100 }),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const insertAiUsageLogSchema = createInsertSchema(aiUsageLogsTable).omit({
  id: true,
  createdAt: true,
});

export type AiUsageLog = typeof aiUsageLogsTable.$inferSelect;
export type InsertAiUsageLog = z.infer<typeof insertAiUsageLogSchema>;

// Таблиця повідомлень AI чату для кожної гри
export const aiChatMessagesTable = pgTable("ai_chat_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id").notNull().references(() => gameSessionsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // 'user' | 'assistant' | 'system' | 'image'
  content: text("content").notNull(),
  imageUrl: text("image_url"), // URL згенерованого зображення
  metadata: json("metadata"), // Додаткові дані (токени, модель тощо)
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const aiChatMessagesRelations = relations(aiChatMessagesTable, ({ one }) => ({
  session: one(gameSessionsTable, {
    fields: [aiChatMessagesTable.sessionId],
    references: [gameSessionsTable.id],
  }),
  user: one(usersTable, {
    fields: [aiChatMessagesTable.userId],
    references: [usersTable.id],
  }),
}));

export const insertAiChatMessageSchema = createInsertSchema(aiChatMessagesTable).omit({
  id: true,
  createdAt: true,
});

export type AiChatMessage = typeof aiChatMessagesTable.$inferSelect;
export type InsertAiChatMessage = z.infer<typeof insertAiChatMessageSchema>;

// Таблиця AI аналізу бренду
export const brandAiAnalysesTable = pgTable("brand_ai_analyses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: uuid("brand_id").notNull().references(() => userBrandsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  analysisType: varchar("analysis_type", { length: 50 }).notNull(), // 'full', 'soul', 'mind', 'body', 'consistency'
  content: json("content").notNull(), // AI analysis content
  score: integer("score"), // Overall score 0-100
  insights: json("insights"), // Key insights array
  recommendations: json("recommendations"), // Recommendations array
  strengths: json("strengths"), // Brand strengths
  weaknesses: json("weaknesses"), // Brand weaknesses
  provider: varchar("provider", { length: 50 }), // 'openai', 'perplexity'
  model: varchar("model", { length: 100 }), // Model used
  tokensUsed: integer("tokens_used"),
  generationTimeMs: integer("generation_time_ms"), // Time to generate in milliseconds
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
}, (table) => ({
  brandIdIdx: index("brand_ai_analyses_brand_id_idx").on(table.brandId),
  userIdIdx: index("brand_ai_analyses_user_id_idx").on(table.userId),
  createdAtIdx: index("brand_ai_analyses_created_at_idx").on(table.createdAt),
}));

export const brandAiAnalysesRelations = relations(brandAiAnalysesTable, ({ one }) => ({
  brand: one(userBrandsTable, {
    fields: [brandAiAnalysesTable.brandId],
    references: [userBrandsTable.id],
  }),
  user: one(usersTable, {
    fields: [brandAiAnalysesTable.userId],
    references: [usersTable.id],
  }),
}));

export const insertBrandAiAnalysisSchema = createInsertSchema(brandAiAnalysesTable).omit({
  id: true,
  createdAt: true,
});

export type BrandAiAnalysis = typeof brandAiAnalysesTable.$inferSelect;
export type InsertBrandAiAnalysis = z.infer<typeof insertBrandAiAnalysisSchema>;

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

// Схеми для нових таблиць
export const insertCardTypeSchema = createInsertSchema(cardTypesTable).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCardOptionSetSchema = createInsertSchema(cardOptionSetsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCardOptionSchema = createInsertSchema(cardOptionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCardOptionSetLinkSchema = createInsertSchema(cardOptionSetLinksTable).omit({
  id: true,
  createdAt: true,
});

// Таблиця темплейтів генерації зображень
export const generationTemplatesTable = pgTable("generation_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  referenceImageUrl: text("reference_image_url"), // URL картинки-референсу
  prompt: text("prompt").notNull(), // Прихований промпт для генерації
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const insertGenerationTemplateSchema = createInsertSchema(generationTemplatesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type GenerationTemplate = typeof generationTemplatesTable.$inferSelect;
export type InsertGenerationTemplate = z.infer<typeof insertGenerationTemplateSchema>;

// Таблиця типів мерчу (футболка, чашка і т.п.)
export const merchTypesTable = pgTable("merch_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  emoji: varchar("emoji", { length: 10 }).notNull(), // Емоджі для відображення
  prompt: text("prompt").notNull(), // Промпт для генерації
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const insertMerchTypeSchema = createInsertSchema(merchTypesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type MerchType = typeof merchTypesTable.$inferSelect;
export type InsertMerchType = z.infer<typeof insertMerchTypeSchema>;

// Таблиця медіа-файлів (централізоване сховище для всіх зображень)
export const mediaAssetsTable = pgTable("media_assets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").references(() => userBrandsTable.id, { onDelete: "set null" }),
  // Тип медіа: logo, avatar, chat_user, chat_ai, merch, attachment
  assetType: varchar("asset_type", { length: 50 }).notNull(),
  // Шлях у Object Storage
  storageKey: text("storage_key").notNull(),
  // Публічний URL для доступу
  publicUrl: text("public_url").notNull(),
  // Оптимізована версія (thumbnail)
  thumbnailKey: text("thumbnail_key"),
  thumbnailUrl: text("thumbnail_url"),
  // Метадані файлу
  filename: varchar("filename", { length: 255 }),
  mimeType: varchar("mime_type", { length: 100 }),
  sizeBytes: integer("size_bytes"),
  width: integer("width"),
  height: integer("height"),
  // Опціональний опис/alt текст
  altText: text("alt_text"),
  // Зв'язок з чат-повідомленням (якщо з чату)
  chatMessageId: uuid("chat_message_id").references(() => aiChatMessagesTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
}, (table) => ({
  userIdIdx: index("media_assets_user_id_idx").on(table.userId),
  brandIdIdx: index("media_assets_brand_id_idx").on(table.brandId),
  assetTypeIdx: index("media_assets_asset_type_idx").on(table.assetType),
}));

export const insertMediaAssetSchema = createInsertSchema(mediaAssetsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type MediaAsset = typeof mediaAssetsTable.$inferSelect;
export type InsertMediaAsset = z.infer<typeof insertMediaAssetSchema>;

// Таблиця квот користувачів на медіа
export const userMediaQuotasTable = pgTable("user_media_quotas", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  // Ліміти в байтах
  maxTotalBytes: integer("max_total_bytes").notNull().default(104857600), // 100MB за замовчуванням
  usedBytes: integer("used_bytes").notNull().default(0),
  // Ліміти за кількістю файлів
  maxFiles: integer("max_files").notNull().default(100),
  usedFiles: integer("used_files").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const insertUserMediaQuotaSchema = createInsertSchema(userMediaQuotasTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserMediaQuota = typeof userMediaQuotasTable.$inferSelect;
export type InsertUserMediaQuota = z.infer<typeof insertUserMediaQuotaSchema>;

// ============================================
// Тарифні плани та підписки
// ============================================

// Таблиця тарифних планів
export const subscriptionPlansTable = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // "free", "basic", "pro"
  displayName: varchar("display_name", { length: 200 }).notNull(), // "Безкоштовний", "Базовий", "Професійний"
  description: text("description"),
  // Ціни
  priceMonthly: integer("price_monthly").notNull().default(0), // в центах (EUR)
  priceYearly: integer("price_yearly").notNull().default(0), // в центах (EUR)
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  // Квоти
  maxBrands: integer("max_brands").notNull().default(1),
  maxGamesPerBrand: integer("max_games_per_brand").notNull().default(1),
  maxTotalGames: integer("max_total_games").notNull().default(1),
  // Квоти медіа (перезаписують дефолтні)
  maxStorageBytes: integer("max_storage_bytes").notNull().default(104857600), // 100MB
  maxMediaFiles: integer("max_media_files").notNull().default(100),
  // Преміум фічі (JSON масив назв фіч)
  features: json("features").default(sql`'[]'`),
  // Статус плану
  isDefault: boolean("is_default").notNull().default(false), // план за замовчуванням для нових користувачів
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  // Стилі для відображення
  color: varchar("color", { length: 20 }).default("#6366f1"),
  icon: varchar("icon", { length: 50 }).default("star"),
  badge: varchar("badge", { length: 50 }), // "popular", "best_value", etc.
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlansTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SubscriptionPlan = typeof subscriptionPlansTable.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

// Таблиця підписок користувачів
export const userSubscriptionsTable = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  planId: integer("plan_id").notNull().references(() => subscriptionPlansTable.id),
  // Період оплати
  billingPeriod: varchar("billing_period", { length: 20 }).notNull().default("monthly"), // "monthly", "yearly"
  // Статус підписки
  status: varchar("status", { length: 20 }).notNull().default("active"), // "active", "cancelled", "expired", "pending"
  // Дати
  startedAt: timestamp("started_at").default(sql`now()`).notNull(),
  expiresAt: timestamp("expires_at"), // null для безкоштовного плану
  cancelledAt: timestamp("cancelled_at"),
  // Пробний період
  trialEndsAt: timestamp("trial_ends_at"),
  // Платіжна інформація
  paymentMethod: varchar("payment_method", { length: 50 }), // "card", "monobank", "mock"
  lastPaymentAt: timestamp("last_payment_at"),
  nextPaymentAt: timestamp("next_payment_at"),
  // Recurring billing fields
  billingRetryCount: integer("billing_retry_count").notNull().default(0), // How many retry attempts
  billingGraceUntil: timestamp("billing_grace_until"), // Grace period deadline (2 days after first failure)
  lastBillingError: text("last_billing_error"), // Last billing error message
  lastBillingAttempt: timestamp("last_billing_attempt"), // Last auto-charge attempt
  // Метадані транзакцій (для майбутньої інтеграції Stripe)
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  // Monobank subscription for recurring payments
  monoCardToken: varchar("mono_card_token", { length: 255 }),
  monoSubscriptionId: varchar("mono_subscription_id", { length: 255 }),
  metadata: json("metadata").default(sql`'{}'`),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
}, (table) => ({
  userIdIdx: index("user_subscriptions_user_id_idx").on(table.userId),
  planIdIdx: index("user_subscriptions_plan_id_idx").on(table.planId),
  statusIdx: index("user_subscriptions_status_idx").on(table.status),
}));

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserSubscription = typeof userSubscriptionsTable.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

// Таблиця історії платежів (Monobank інтеграція)
export const paymentHistoryTable = pgTable("payment_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").references(() => userSubscriptionsTable.id, { onDelete: "set null" }),
  planId: integer("plan_id").references(() => subscriptionPlansTable.id),
  // Деталі платежу
  amount: integer("amount").notNull(), // в копійках (UAH)
  currency: varchar("currency", { length: 3 }).notNull().default("UAH"),
  status: varchar("status", { length: 30 }).notNull(), // "pending", "processing", "success", "failure", "expired", "reversed"
  paymentMethod: varchar("payment_method", { length: 50 }).notNull().default("monobank"), // "monobank", "mock"
  description: text("description"),
  billingPeriod: varchar("billing_period", { length: 20 }), // "monthly", "yearly"
  // Monobank інтеграція
  monoInvoiceId: varchar("mono_invoice_id", { length: 100 }),
  monoPaymentId: varchar("mono_payment_id", { length: 100 }),
  monoPageUrl: text("mono_page_url"),
  monoReference: varchar("mono_reference", { length: 100 }),
  monoFailureReason: text("mono_failure_reason"),
  // Для інших провайдерів
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  metadata: json("metadata").default(sql`'{}'`),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  userIdIdx: index("payment_history_user_id_idx").on(table.userId),
  monoInvoiceIdx: index("payment_history_mono_invoice_idx").on(table.monoInvoiceId),
  statusIdx: index("payment_history_status_idx").on(table.status),
}));

export const insertPaymentHistorySchema = createInsertSchema(paymentHistoryTable).omit({
  id: true,
  createdAt: true,
});

export type PaymentHistory = typeof paymentHistoryTable.$inferSelect;
export type InsertPaymentHistory = z.infer<typeof insertPaymentHistorySchema>;

// Таблиця преміум фіч (налаштовувані в адмінці)
export const premiumFeaturesTable = pgTable("premium_features", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(), // "ai_chat", "image_generation", "export_pdf", etc.
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const insertPremiumFeatureSchema = createInsertSchema(premiumFeaturesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PremiumFeature = typeof premiumFeaturesTable.$inferSelect;
export type InsertPremiumFeature = z.infer<typeof insertPremiumFeatureSchema>;