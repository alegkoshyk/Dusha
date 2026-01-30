import { 
  type GameSession, 
  type InsertGameSession, 
  type BrandMap,
  type GameCard,
  type GameLevel,
  type CardResponse,
  type InsertCardResponse,
  type User,
  type InsertUser,
  type UserSettings,
  type InsertUserSettings,
  type UserBrand,
  type InsertUserBrand,
  type UserProfile,
  type InsertUserProfile,
  type AppSetting,
  type AiUsageLog,
  type InsertAiUsageLog,
  type AiChatMessage,
  type InsertAiChatMessage,
  gameSessionsTable,
  cardResponsesTable,
  gameCardsTable,
  gameLevelsTable,
  usersTable,
  userSettingsTable,
  userBrandsTable,
  userProfilesTable,
  cardPropertiesTable,
  cardRelationsTable,
  cardTypesTable,
  cardOptionSetsTable,
  cardOptionsTable,
  cardOptionSetLinksTable,
  appSettingsTable,
  aiUsageLogsTable,
  aiChatMessagesTable,
  type CardType,
  type InsertCardType,
  type CardOptionSet,
  type InsertCardOptionSet,
  type CardOption,
  type InsertCardOption,
  type CardOptionSetLink,
  type InsertCardOptionSetLink,
  type BrandAiAnalysis,
  type InsertBrandAiAnalysis,
  brandAiAnalysesTable,
  type GenerationTemplate,
  type InsertGenerationTemplate,
  generationTemplatesTable,
  type MerchType,
  type InsertMerchType,
  merchTypesTable,
  type MediaAsset,
  type InsertMediaAsset,
  mediaAssetsTable,
  type UserMediaQuota,
  type InsertUserMediaQuota,
  userMediaQuotasTable,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  subscriptionPlansTable,
  type UserSubscription,
  type InsertUserSubscription,
  userSubscriptionsTable,
  type PaymentHistory,
  type InsertPaymentHistory,
  paymentHistoryTable,
  type PremiumFeature,
  type InsertPremiumFeature,
  premiumFeaturesTable,
  type ExternalBrandAnalysis,
  type InsertExternalBrandAnalysis,
  externalBrandAnalysesTable,
  type BrandAnalysisSetting,
  type InsertBrandAnalysisSetting,
  brandAnalysisSettingsTable,
  type BrandAnalysisTemplate,
  type InsertBrandAnalysisTemplate,
  brandAnalysisTemplatesTable,
  type TargetAudience,
  type InsertTargetAudience,
  targetAudiencesTable,
  type AudienceSegment,
  type InsertAudienceSegment,
  audienceSegmentsTable,
  type DemographicSegment,
  type InsertDemographicSegment,
  demographicSegmentsTable,
  type DemographicSubSegment,
  type InsertDemographicSubSegment,
  demographicSubSegmentsTable,
  audienceTypeCategoriesTable,
  audienceTypesTable,
  type BrandProduct,
  type InsertBrandProduct,
  brandProductsTable,
  type ProductCategory,
  type InsertProductCategory,
  productCategoriesTable,
} from "@shared/schema";
import { db } from "./db";
import { eq, count, sql, and, isNotNull, or, inArray, desc, gte, lte } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User authentication operations
  createUser(userData: { email: string; firstName?: string | null; lastName?: string | null; password: string }): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  updateUserLoginTime(id: string): Promise<void>;
  
  // Token-based authentication for iPad compatibility
  createAuthToken(userId: string, token: string): Promise<void>;
  getUserByAuthToken(token: string): Promise<User | undefined>;
  cleanupExpiredTokens(): Promise<void>;
  
  // User data operations  
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings | undefined>;
  
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined>;
  
  // User brands operations
  createUserBrand(brand: InsertUserBrand): Promise<UserBrand>;
  getUserBrands(userId: string): Promise<UserBrand[]>;
  getUserBrand(id: string): Promise<UserBrand | undefined>;
  updateUserBrand(id: string, updates: Partial<UserBrand>): Promise<UserBrand | undefined>;
  updateUserBrandLogo(id: string, logo: string | null): Promise<UserBrand | undefined>;
  deleteUserBrand(id: string): Promise<boolean>;
  getAllBrands(): Promise<UserBrand[]>;
  getGameSessionsByBrand(brandId: string): Promise<GameSession[]>;
  
  // Game session CRUD operations
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getGameSession(id: string): Promise<GameSession | undefined>;
  getUserGameSessions(userId: string): Promise<GameSession[]>;
  updateGameSession(id: string, sessionId: string, updates: Partial<GameSession>): Promise<GameSession | undefined>;
  deleteGameSession(id: string): Promise<boolean>;
  
  // Game progress operations
  saveCardResponse(sessionId: string, cardId: string, response: any, responseType: string, timeData?: { timeSpent?: number; isWithinTimeLimit?: boolean; earnedXP?: number }): Promise<GameSession | undefined>;
  getCardResponses(sessionId: string): Promise<CardResponse[]>;
  getGameProgress(sessionId: string): Promise<{ progress: number; currentLevel: string; currentCard: string } | undefined>;
  generateBrandMap(sessionId: string): Promise<BrandMap | undefined>;
  
  // Game data operations
  getGameCards(levelId?: string): Promise<GameCard[]>;
  getGameLevels(): Promise<GameLevel[]>;
  
  // Card option sets operations
  getCardOptionSets(cardTypeId?: string): Promise<CardOptionSet[]>;
  getCardOptionSet(id: string): Promise<CardOptionSet | undefined>;
  createCardOptionSet(optionSet: InsertCardOptionSet): Promise<CardOptionSet>;
  updateCardOptionSet(id: string, updates: Partial<CardOptionSet>): Promise<CardOptionSet | undefined>;
  deleteCardOptionSet(id: string): Promise<boolean>;
  
  // Card options operations
  getCardOptions(optionSetId: string): Promise<CardOption[]>;
  getCardOptionsBySetId(setId: string): Promise<CardOption[]>;
  createCardOption(option: InsertCardOption): Promise<CardOption>;
  updateCardOption(id: string, updates: Partial<CardOption>): Promise<CardOption | undefined>;
  deleteCardOption(id: string): Promise<boolean>;
  
  // Card option set links operations
  getCardOptionSetLinks(cardId: string): Promise<CardOptionSetLink[]>;
  createCardOptionSetLink(link: InsertCardOptionSetLink): Promise<CardOptionSetLink>;
  updateCardOptionSetLink(id: string, updates: Partial<CardOptionSetLink>): Promise<CardOptionSetLink | undefined>;
  deleteCardOptionSetLink(id: string): Promise<boolean>;
  
  // Brand AI Analysis operations
  createBrandAiAnalysis(analysis: InsertBrandAiAnalysis): Promise<BrandAiAnalysis>;
  getBrandAiAnalyses(brandId: string): Promise<BrandAiAnalysis[]>;
  getLatestBrandAiAnalysis(brandId: string): Promise<BrandAiAnalysis | undefined>;
  
  // Generation templates operations
  getGenerationTemplates(): Promise<GenerationTemplate[]>;
  getGenerationTemplate(id: number): Promise<GenerationTemplate | undefined>;
  createGenerationTemplate(template: InsertGenerationTemplate): Promise<GenerationTemplate>;
  updateGenerationTemplate(id: number, updates: Partial<GenerationTemplate>): Promise<GenerationTemplate | undefined>;
  deleteGenerationTemplate(id: number): Promise<boolean>;
  
  // Media assets operations
  createMediaAsset(asset: InsertMediaAsset): Promise<MediaAsset>;
  getMediaAsset(id: string): Promise<MediaAsset | undefined>;
  getUserMediaAssets(userId: string, assetType?: string): Promise<MediaAsset[]>;
  getBrandMediaAssets(brandId: string): Promise<MediaAsset[]>;
  updateMediaAsset(id: string, updates: Partial<MediaAsset>): Promise<MediaAsset | undefined>;
  deleteMediaAsset(id: string): Promise<boolean>;
  
  // Media quotas operations
  getUserMediaQuota(userId: string): Promise<UserMediaQuota | undefined>;
  createOrUpdateUserMediaQuota(userId: string, updates: Partial<UserMediaQuota>): Promise<UserMediaQuota>;
  updateQuotaUsage(userId: string, bytesChange: number, filesChange: number): Promise<UserMediaQuota | undefined>;
  checkQuotaAvailable(userId: string, bytesToAdd: number): Promise<boolean>;
  
  // Subscription plans operations
  getSubscriptionPlans(activeOnly?: boolean): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  getDefaultSubscriptionPlan(): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: number, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deleteSubscriptionPlan(id: number): Promise<boolean>;
  
  // User subscriptions operations
  getUserSubscription(userId: string): Promise<UserSubscription | undefined>;
  getUserSubscriptionWithPlan(userId: string): Promise<{ subscription: UserSubscription; plan: SubscriptionPlan } | undefined>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(userId: string, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined>;
  cancelUserSubscription(userId: string): Promise<UserSubscription | undefined>;
  
  // Recurring billing operations
  getSubscriptionsDueForBilling(): Promise<UserSubscription[]>;
  getExpiredGracePeriodSubscriptions(): Promise<UserSubscription[]>;
  getActiveMonobankSubscriptions(): Promise<UserSubscription[]>;
  updateSubscriptionBillingAttempt(subscriptionId: string, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined>;
  updateSubscription(subscriptionId: string, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined>;
  getDefaultFreePlan(): Promise<SubscriptionPlan | undefined>;
  getUser(userId: string): Promise<User | undefined>;
  
  // Quota checking for subscriptions
  getUserQuotas(userId: string): Promise<{ maxBrands: number; maxTotalGames: number; usedBrands: number; usedGames: number }>;
  canCreateBrand(userId: string): Promise<boolean>;
  canCreateGame(userId: string): Promise<boolean>;
  
  // Payment history operations
  createPaymentHistory(payment: InsertPaymentHistory): Promise<PaymentHistory>;
  getUserPaymentHistory(userId: string): Promise<PaymentHistory[]>;
  getPaymentByMonoInvoiceId(invoiceId: string): Promise<PaymentHistory | undefined>;
  getPaymentByMonoReference(reference: string): Promise<PaymentHistory | undefined>;
  updatePaymentByMonoInvoiceId(invoiceId: string, updates: Partial<PaymentHistory>): Promise<PaymentHistory | undefined>;
  updatePaymentById(id: string, updates: Partial<PaymentHistory>): Promise<PaymentHistory | undefined>;
  getAllPayments(limit?: number, offset?: number): Promise<{ payments: PaymentHistory[]; total: number }>;
  
  // Premium features operations
  getPremiumFeatures(activeOnly?: boolean): Promise<PremiumFeature[]>;
  createPremiumFeature(feature: InsertPremiumFeature): Promise<PremiumFeature>;
  updatePremiumFeature(id: number, updates: Partial<PremiumFeature>): Promise<PremiumFeature | undefined>;
  deletePremiumFeature(id: number): Promise<boolean>;
  
  // External brand analysis operations
  createExternalBrandAnalysis(analysis: InsertExternalBrandAnalysis): Promise<ExternalBrandAnalysis>;
  getExternalBrandAnalyses(userId: string): Promise<ExternalBrandAnalysis[]>;
  getExternalBrandAnalysis(id: string): Promise<ExternalBrandAnalysis | undefined>;
  updateExternalBrandAnalysis(id: string, updates: Partial<ExternalBrandAnalysis>): Promise<ExternalBrandAnalysis | undefined>;
  deleteExternalBrandAnalysis(id: string): Promise<boolean>;
  
  // Brand analysis settings operations (admin)
  getBrandAnalysisSettings(): Promise<BrandAnalysisSetting[]>;
  getBrandAnalysisSetting(key: string): Promise<BrandAnalysisSetting | undefined>;
  updateBrandAnalysisSetting(key: string, value: string): Promise<BrandAnalysisSetting | undefined>;
  createBrandAnalysisSetting(setting: InsertBrandAnalysisSetting): Promise<BrandAnalysisSetting>;
  
  // Brand analysis templates operations
  getBrandAnalysisTemplates(): Promise<BrandAnalysisTemplate[]>;
  getBrandAnalysisTemplate(id: number): Promise<BrandAnalysisTemplate | undefined>;
  getDefaultBrandAnalysisTemplate(): Promise<BrandAnalysisTemplate | undefined>;
  createBrandAnalysisTemplate(template: InsertBrandAnalysisTemplate): Promise<BrandAnalysisTemplate>;
  updateBrandAnalysisTemplate(id: number, updates: Partial<BrandAnalysisTemplate>): Promise<BrandAnalysisTemplate | undefined>;
  deleteBrandAnalysisTemplate(id: number): Promise<boolean>;
  setDefaultBrandAnalysisTemplate(id: number): Promise<boolean>;
  
  // Target audience operations
  getTargetAudiences(brandId: string): Promise<TargetAudience[]>;
  getTargetAudience(id: string): Promise<TargetAudience | undefined>;
  createTargetAudience(audience: InsertTargetAudience): Promise<TargetAudience>;
  updateTargetAudience(id: string, updates: Partial<TargetAudience>): Promise<TargetAudience | undefined>;
  deleteTargetAudience(id: string): Promise<boolean>;
  
  // Audience segment operations (old)
  getAudienceSegments(audienceId: string): Promise<AudienceSegment[]>;
  getAudienceSegment(id: string): Promise<AudienceSegment | undefined>;
  createAudienceSegment(segment: InsertAudienceSegment): Promise<AudienceSegment>;
  updateAudienceSegment(id: string, updates: Partial<AudienceSegment>): Promise<AudienceSegment | undefined>;
  deleteAudienceSegment(id: string): Promise<boolean>;
  
  // Demographic segment operations (new)
  getDemographicSegments(brandId: string): Promise<DemographicSegment[]>;
  getDemographicSegment(id: string): Promise<DemographicSegment | undefined>;
  createDemographicSegment(segment: InsertDemographicSegment): Promise<DemographicSegment>;
  updateDemographicSegment(id: string, updates: Partial<DemographicSegment>): Promise<DemographicSegment | undefined>;
  deleteDemographicSegment(id: string): Promise<boolean>;
  
  // Demographic sub-segment operations
  getDemographicSubSegments(segmentId: string): Promise<DemographicSubSegment[]>;
  getDemographicSubSegment(id: string): Promise<DemographicSubSegment | undefined>;
  createDemographicSubSegment(subSegment: InsertDemographicSubSegment): Promise<DemographicSubSegment>;
  updateDemographicSubSegment(id: string, updates: Partial<DemographicSubSegment>): Promise<DemographicSubSegment | undefined>;
  deleteDemographicSubSegment(id: string): Promise<boolean>;
  
  // Brand products operations
  getBrandProducts(brandId: string): Promise<BrandProduct[]>;
  getBrandProduct(id: string): Promise<BrandProduct | undefined>;
  createBrandProduct(product: InsertBrandProduct): Promise<BrandProduct>;
  updateBrandProduct(id: string, updates: Partial<BrandProduct>): Promise<BrandProduct | undefined>;
  deleteBrandProduct(id: string): Promise<boolean>;
  
  // Product categories operations
  getProductCategories(brandId: string): Promise<ProductCategory[]>;
  getProductCategory(id: string): Promise<ProductCategory | undefined>;
  createProductCategory(category: InsertProductCategory): Promise<ProductCategory>;
  updateProductCategory(id: string, updates: Partial<ProductCategory>): Promise<ProductCategory | undefined>;
  deleteProductCategory(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User authentication operations
  async createUser(userData: { email: string; firstName?: string | null; lastName?: string | null; password: string }): Promise<User> {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    const { password, ...userDataWithoutPassword } = userData;
    
    const [user] = await db
      .insert(usersTable)
      .values({
        ...userDataWithoutPassword,
        passwordHash,
      })
      .returning();
      
    // Create default user settings and profile with registration-provided names
    await this.createUserSettings({ userId: user.id });
    const hasNames = !!(userData.firstName && userData.lastName);
    await this.createUserProfile({ 
      userId: user.id,
      firstName: userData.firstName || undefined,
      lastName: userData.lastName || undefined,
      onboardingCompleted: hasNames,
    });
    
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    return user;
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  async updateUserLoginTime(id: string): Promise<void> {
    await db
      .update(usersTable)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(usersTable.id, id));
  }

  // Alias for OAuth providers
  async updateUserLastLogin(id: string): Promise<void> {
    return this.updateUserLoginTime(id);
  }

  // OAuth user operations
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.googleId, googleId))
      .limit(1);
    return user;
  }

  async getUserByAppleId(appleId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.appleId, appleId))
      .limit(1);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(usersTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning();
    return updated;
  }

  async createOAuthUser(userData: {
    email?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    googleId?: string;
    appleId?: string;
    authProvider: string;
  }): Promise<User> {
    const [user] = await db
      .insert(usersTable)
      .values({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        avatar: userData.avatar,
        googleId: userData.googleId,
        appleId: userData.appleId,
        authProvider: userData.authProvider,
        passwordHash: null as any, // OAuth users don't have password
      })
      .returning();

    // Create default user settings and profile with OAuth-provided names
    await this.createUserSettings({ userId: user.id });
    const hasNames = !!(userData.firstName && userData.lastName);
    await this.createUserProfile({ 
      userId: user.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      onboardingCompleted: hasNames,
    });

    return user;
  }

  // Simple in-memory token storage for iPad compatibility
  private authTokens: Map<string, { userId: string; createdAt: Date }> = new Map();

  async createAuthToken(userId: string, token: string): Promise<void> {
    this.authTokens.set(token, { userId, createdAt: new Date() });
    // Auto cleanup tokens older than 30 days
    setTimeout(() => this.cleanupExpiredTokens(), 1000);
  }

  async getUserByAuthToken(token: string): Promise<User | undefined> {
    const tokenData = this.authTokens.get(token);
    if (!tokenData) return undefined;
    
    // Check if token is expired (30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (tokenData.createdAt < thirtyDaysAgo) {
      this.authTokens.delete(token);
      return undefined;
    }
    
    return await this.getUserById(tokenData.userId);
  }

  async cleanupExpiredTokens(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    for (const [token, data] of this.authTokens.entries()) {
      if (data.createdAt < thirtyDaysAgo) {
        this.authTokens.delete(token);
      }
    }
  }

  // User data operations
  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [userSettings] = await db
      .insert(userSettingsTable)
      .values(settings)
      .returning();
    return userSettings;
  }

  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettingsTable)
      .where(eq(userSettingsTable.userId, userId))
      .limit(1);
    return settings;
  }

  async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings | undefined> {
    const [updated] = await db
      .update(userSettingsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSettingsTable.userId, userId))
      .returning();
    return updated;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [userProfile] = await db
      .insert(userProfilesTable)
      .values(profile)
      .returning();
    return userProfile;
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, userId))
      .limit(1);
    return profile;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    const [updated] = await db
      .update(userProfilesTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProfilesTable.userId, userId))
      .returning();
    return updated;
  }

  // User brands operations
  async createUserBrand(brand: InsertUserBrand): Promise<UserBrand> {
    const [userBrand] = await db
      .insert(userBrandsTable)
      .values(brand)
      .returning();
    return userBrand;
  }

  async getUserBrands(userId: string): Promise<UserBrand[]> {
    return await db
      .select()
      .from(userBrandsTable)
      .where(eq(userBrandsTable.userId, userId))
      .orderBy(userBrandsTable.createdAt);
  }

  async getUserBrand(id: string): Promise<UserBrand | undefined> {
    const [brand] = await db
      .select()
      .from(userBrandsTable)
      .where(eq(userBrandsTable.id, id))
      .limit(1);
    return brand;
  }

  async updateUserBrand(id: string, updates: Partial<UserBrand>): Promise<UserBrand | undefined> {
    const [updated] = await db
      .update(userBrandsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userBrandsTable.id, id))
      .returning();
    return updated;
  }

  async updateUserBrandLogo(id: string, logo: string | null): Promise<UserBrand | undefined> {
    const [updated] = await db
      .update(userBrandsTable)
      .set({ logo, updatedAt: new Date() })
      .where(eq(userBrandsTable.id, id))
      .returning();
    return updated;
  }

  async deleteUserBrand(id: string): Promise<boolean> {
    try {
      // Отримуємо всі сесії для цього бренду
      const sessions = await db
        .select({ id: gameSessionsTable.id })
        .from(gameSessionsTable)
        .where(eq(gameSessionsTable.brandId, id));
      
      console.log(`Found ${sessions.length} sessions for brand ${id}`);
      
      // Видаляємо всі відповіді для всіх сесій цього бренду
      for (const session of sessions) {
        await db
          .delete(cardResponsesTable)
          .where(eq(cardResponsesTable.sessionId, session.id));
        console.log(`Deleted responses for session: ${session.id}`);
      }
      
      // Видаляємо всі сесії для цього бренду
      await db
        .delete(gameSessionsTable)
        .where(eq(gameSessionsTable.brandId, id));
      console.log(`Deleted ${sessions.length} sessions for brand ${id}`);
      
      // Тепер видаляємо сам бренд
      const result = await db
        .delete(userBrandsTable)
        .where(eq(userBrandsTable.id, id));
      
      console.log(`Deleted brand ${id}, rows affected: ${result.rowCount}`);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error in deleteUserBrand:", error);
      throw error;
    }
  }

  async getAllBrands(): Promise<UserBrand[]> {
    return await db
      .select()
      .from(userBrandsTable)
      .orderBy(desc(userBrandsTable.createdAt));
  }

  async getGameSessionsByBrand(brandId: string): Promise<GameSession[]> {
    return await db
      .select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.brandId, brandId))
      .orderBy(desc(gameSessionsTable.createdAt));
  }

  // Game session CRUD operations
  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
    // Перевіряємо чи є активна гра для цього бренду
    if (insertSession.brandId) {
      const existingActiveSessions = await db
        .select()
        .from(gameSessionsTable)
        .where(and(
          eq(gameSessionsTable.brandId, insertSession.brandId),
          sql`${gameSessionsTable.completed} IS NULL`
        ));
      
      if (existingActiveSessions.length > 0) {
        // Повертаємо існуючу активну сесію з відповідями
        const existingSession = existingActiveSessions[0];
        const responses = await this.getCardResponses(existingSession.id);
        const responseMap: Record<string, any> = {};
        
        responses.forEach(response => {
          responseMap[response.cardId] = response.response;
        });

        return {
          ...existingSession,
          responses: responseMap
        } as GameSession;
      }
    }

    const [session] = await db
      .insert(gameSessionsTable)
      .values(insertSession)
      .returning();
    return session;
  }

  async getGameSession(id: string): Promise<GameSession | undefined> {
    const [session] = await db
      .select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.id, id));

    if (!session) return undefined;

    // Fetch responses for this session
    const responses = await this.getCardResponses(id);
    const responseMap: Record<string, any> = {};
    
    responses.forEach(response => {
      responseMap[response.cardId] = response.response;
    });

    return {
      ...session,
      responses: responseMap
    } as GameSession;
  }

  async getUserGameSessions(userId: string): Promise<GameSession[]> {
    // Спочатку спробуємо через user_id в game_sessions (пряме поле)
    const directSessions = await db
      .select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.userId, userId))
      .orderBy(gameSessionsTable.createdAt);
    
    if (directSessions.length > 0) {
      return directSessions;
    }
    
    // Якщо немає прямих сесій, шукаємо через бренди
    return await db
      .select({
        id: gameSessionsTable.id,
        brandId: gameSessionsTable.brandId,
        userId: gameSessionsTable.userId,
        currentLevel: gameSessionsTable.currentLevel,
        currentCard: gameSessionsTable.currentCard,
        progress: gameSessionsTable.progress,
        totalXp: gameSessionsTable.totalXp,
        completedCards: gameSessionsTable.completedCards,
        earnedBadges: gameSessionsTable.earnedBadges,
        completed: gameSessionsTable.completed,
        createdAt: gameSessionsTable.createdAt,
        updatedAt: gameSessionsTable.updatedAt
      })
      .from(gameSessionsTable)
      .innerJoin(userBrandsTable, eq(gameSessionsTable.brandId, userBrandsTable.id))
      .where(eq(userBrandsTable.userId, userId))
      .orderBy(gameSessionsTable.createdAt);
  }

  async getUserStats(userId: string): Promise<{totalXp: number; totalGames: number; completedGames: number}> {
    // Отримуємо всі сесії користувача
    const sessions = await this.getUserGameSessions(userId);
    
    // Для кожної сесії рахуємо XP і оновлюємо totalXp в базі
    let totalXpFromAllGames = 0;
    
    for (const session of sessions) {
      // Отримуємо всі відповіді для цієї сесії
      const responses = await this.getCardResponses(session.id);
      const calculatedXp = responses.reduce((sum, response) => {
        return sum + (response.earnedXP || 0);
      }, 0);
      
      // Оновлюємо totalXp в сесії якщо він не співпадає з розрахованим
      if (calculatedXp !== (session.totalXp || 0)) {
        await db
          .update(gameSessionsTable)
          .set({ totalXp: calculatedXp })
          .where(eq(gameSessionsTable.id, session.id));
      }
      
      // Додаємо до загальної суми
      totalXpFromAllGames += calculatedXp;
    }
    
    const totalGames = sessions.length;
    const completedGames = sessions.filter(s => s.completed).length;
    
    return {
      totalXp: totalXpFromAllGames,
      totalGames,
      completedGames
    };
  }

  async updateGameSession(id: string, sessionId: string, updates: Partial<GameSession>): Promise<GameSession | undefined> {
    const [session] = await db
      .update(gameSessionsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(gameSessionsTable.id, sessionId))
      .returning();
    return session || undefined;
  }

  async deleteGameSession(id: string): Promise<boolean> {
    try {
      // Спочатку видаляємо всі відповіді для цієї сесії
      await db
        .delete(cardResponsesTable)
        .where(eq(cardResponsesTable.sessionId, id));
      
      console.log(`Deleted card responses for session: ${id}`);
      
      // Тепер видаляємо саму сесію
      const result = await db
        .delete(gameSessionsTable)
        .where(eq(gameSessionsTable.id, id));
      
      console.log(`Deleted game session: ${id}, rows affected: ${result.rowCount}`);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error in deleteGameSession:", error);
      throw error;
    }
  }

  async saveCardResponse(sessionId: string, cardId: string, response: any, responseType: string, timeData?: { timeSpent?: number; isWithinTimeLimit?: boolean; earnedXP?: number }): Promise<GameSession | undefined> {
    console.log("DatabaseStorage.saveCardResponse called with:", { sessionId, cardId, response, responseType });
    
    try {
      // Save individual card response with upsert logic
      await db
        .insert(cardResponsesTable)
        .values({
          sessionId,
          cardId,
          response,
          responseType: responseType as "text" | "choice" | "values",
          ...(timeData && {
            timeSpent: timeData.timeSpent,
            isWithinTimeLimit: timeData.isWithinTimeLimit ?? true,
            earnedXp: timeData.earnedXP ?? 0,
          })
        })
        .onConflictDoUpdate({
          target: [cardResponsesTable.sessionId, cardResponsesTable.cardId],
          set: {
            response,
            responseType: responseType as "text" | "choice" | "values",
            submittedAt: sql`now()`,
            ...(timeData && {
              timeSpent: timeData.timeSpent,
              isWithinTimeLimit: timeData.isWithinTimeLimit ?? true,
              earnedXp: timeData.earnedXP ?? 0,
            })
          }
        });
      
      console.log("Card response saved successfully");
    } catch (error) {
      console.error("Error saving card response:", error);
      throw error;
    }

    // Update session with completed cards
    const completedResponses = await this.getCardResponses(sessionId);
    const completedCards = completedResponses.map(r => r.cardId);
    
    // Calculate progress based on total available cards
    const totalCardsResult = await db.select({ count: count() }).from(gameCardsTable);
    const totalCards = totalCardsResult[0]?.count || 0;
    const progress = Math.round((completedCards.length / totalCards) * 100);

    // Calculate total earned XP
    const totalEarnedXP = completedResponses.reduce((sum, response) => {
      return sum + (response.earnedXP || 0);
    }, 0);

    // Determine next card based on game flow
    const nextCard = await this.getNextCard(completedCards);

    const [session] = await db
      .update(gameSessionsTable)
      .set({
        completedCards,
        progress,
        currentCard: nextCard,
        totalXp: totalEarnedXP,
        updatedAt: sql`now()`,
      })
      .where(eq(gameSessionsTable.id, sessionId))
      .returning();

    return session || undefined;
  }

  async getCardResponses(sessionId: string): Promise<CardResponse[]> {
    return await db
      .select()
      .from(cardResponsesTable)
      .where(eq(cardResponsesTable.sessionId, sessionId));
  }

  async getNextCard(completedCards: string[]): Promise<string> {
    // Define the game flow order
    const gameFlow = [
      'soul-start', 'soul-values', 'soul-deep-values', 'soul-mission', 
      'soul-story', 'soul-purpose', 'soul-emotion', 'soul-impact', 'soul-archetype',
      'mind-start', 'mind-archetype', 'mind-positioning', 'mind-promise', 
      'mind-solution', 'mind-problem', 'mind-audience', 'mind-target',
      'body-start', 'body-products', 'body-channels', 'body-visual', 
      'body-tone', 'body-pricing', 'body-metrics', 'body-launch', 'body-complete'
    ];
    
    // Find the first card that's not completed
    for (const cardId of gameFlow) {
      if (!completedCards.includes(cardId)) {
        return cardId;
      }
    }
    
    // If all cards are completed, return the last card
    return 'body-complete';
  }

  async getGameProgress(sessionId: string): Promise<{ progress: number; currentLevel: string; currentCard: string } | undefined> {
    const [session] = await db
      .select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.id, sessionId));
    
    if (!session) return undefined;

    return {
      progress: session.progress,
      currentLevel: session.currentLevel,
      currentCard: session.currentCard,
    };
  }

  async generateBrandMap(sessionId: string): Promise<BrandMap | undefined> {
    const responses = await this.getCardResponses(sessionId);
    if (responses.length === 0) return undefined;

    // Build brand map from responses
    const brandMap: BrandMap = {
      soul: {
        values: [],
      },
      mind: {},
      body: {
        products: [],
        channels: [],
        actions: [],
      },
    };

    // Process responses and build brand map
    responses.forEach((response) => {
      const cardId = response.cardId;
      const responseData = response.response as any;
      
      if (cardId.startsWith('soul-')) {
        if (cardId === 'soul-values' && responseData.selectedValues) {
          brandMap.soul.values = responseData.selectedValues;
        } else if (cardId === 'soul-mission' && responseData.mission) {
          brandMap.soul.mission = responseData.mission;
        } else if (cardId === 'soul-story' && responseData.story) {
          brandMap.soul.story = responseData.story;
        } else if (cardId === 'soul-purpose' && responseData.purpose) {
          brandMap.soul.purpose = responseData.purpose;
        }
      } else if (cardId.startsWith('mind-')) {
        if (cardId === 'mind-audience' && responseData.audience) {
          brandMap.mind.targetAudience = responseData.audience;
        } else if (cardId === 'mind-idea' && responseData.idea) {
          brandMap.mind.brandIdea = responseData.idea;
        } else if (cardId === 'mind-promise' && responseData.promise) {
          brandMap.mind.promise = responseData.promise;
        } else if (cardId === 'mind-archetype' && responseData.archetype) {
          brandMap.mind.archetype = responseData.archetype;
        } else if (cardId === 'mind-positioning' && responseData.positioning) {
          brandMap.mind.positioning = responseData.positioning;
        } else if (cardId === 'mind-unique-value' && responseData.uniqueValue) {
          brandMap.mind.uniqueValue = responseData.uniqueValue;
        }
      } else if (cardId.startsWith('body-')) {
        if (cardId === 'body-products' && responseData.products) {
          brandMap.body.products = Array.isArray(responseData.products) ? responseData.products : [responseData.products];
        } else if (cardId === 'body-channels' && responseData.channels) {
          brandMap.body.channels = Array.isArray(responseData.channels) ? responseData.channels : [responseData.channels];
        } else if (cardId === 'body-visual-style' && responseData.visualStyle) {
          brandMap.body.visualStyle = responseData.visualStyle;
        } else if (cardId === 'body-tone' && responseData.toneOfVoice) {
          brandMap.body.toneOfVoice = responseData.toneOfVoice;
        } else if (cardId === 'body-actions' && responseData.actions) {
          brandMap.body.actions = Array.isArray(responseData.actions) ? responseData.actions : [responseData.actions];
        } else if (cardId === 'body-resources' && responseData.resources) {
          brandMap.body.resources = responseData.resources;
        }
      }
    });

    return brandMap;
  }

  async getGameCards(levelId?: string): Promise<GameCard[]> {
    let cards: any[];
    
    if (levelId) {
      cards = await db
        .select()
        .from(gameCardsTable)
        .where(eq(gameCardsTable.levelId, levelId));
    } else {
      cards = await db.select().from(gameCardsTable);
    }

    // Load properties for each card
    const cardsWithProperties = await Promise.all(
      cards.map(async (card) => {
        const properties = await db
          .select()
          .from(cardPropertiesTable)
          .where(eq(cardPropertiesTable.cardId, card.id));
        
        return {
          ...card,
          properties: properties
        };
      })
    );

    return cardsWithProperties;
  }

  async getGameLevels(): Promise<GameLevel[]> {
    return await db.select().from(gameLevelsTable);
  }

  async getGameCard(cardId: string): Promise<GameCard | undefined> {
    const [card] = await db
      .select()
      .from(gameCardsTable)
      .where(eq(gameCardsTable.id, cardId));
    return card || undefined;
  }

  async getCardOptionSetsByCardId(cardId: string): Promise<string[]> {
    const links = await db
      .select({ optionSetId: cardOptionSetLinksTable.optionSetId })
      .from(cardOptionSetLinksTable)
      .where(eq(cardOptionSetLinksTable.cardId, cardId));
    
    return links.map(link => link.optionSetId);
  }

  async getSessionCardResponses(sessionId: string): Promise<any[]> {
    try {
      const responses = await db
        .select({
          cardId: cardResponsesTable.cardId,
          cardTitle: gameCardsTable.title,
          cardDescription: gameCardsTable.description,
          cardType: gameCardsTable.type,
          cardHint: gameCardsTable.hint,
          response: cardResponsesTable.response,
          responseType: cardResponsesTable.responseType,
          createdAt: cardResponsesTable.submittedAt,
          level: gameCardsTable.levelId
        })
        .from(cardResponsesTable)
        .innerJoin(gameCardsTable, eq(cardResponsesTable.cardId, gameCardsTable.id))
        .where(eq(cardResponsesTable.sessionId, sessionId))
        .orderBy(gameCardsTable.positionX);
      
      // Load translations once for efficiency
      const valueToName = await this.loadOptionTranslations();
      
      // Translate responses and add options for choice cards
      const translatedResponses = await Promise.all(responses.map(async (r) => {
        const result: any = {
          ...r,
          response: this.translateResponseWithMap(r.response, valueToName)
        };
        
        // Add options for choice/values type cards
        if (['choice', 'values', 'archetype', 'multiselect'].includes(r.cardType || '')) {
          result.options = await this.getCardOptionsByCardId(r.cardId);
        }
        
        return result;
      }));
      
      return translatedResponses;
    } catch (error) {
      console.error("Error in getSessionCardResponses:", error);
      // Fallback to simple responses without join
      const simpleResponses = await db
        .select()
        .from(cardResponsesTable)
        .where(eq(cardResponsesTable.sessionId, sessionId));
      
      // Load translations once
      const valueToName = await this.loadOptionTranslations();
      
      // Manually get card titles and translate responses
      const result = [];
      for (const response of simpleResponses) {
        const card = await this.getGameCard(response.cardId);
        const translatedResponse = this.translateResponseWithMap(response.response, valueToName);
        const cardResult: any = {
          cardId: response.cardId,
          cardTitle: card?.title || response.cardId,
          cardDescription: card?.description || '',
          cardType: card?.type || 'text',
          cardHint: card?.hint || '',
          response: translatedResponse,
          responseType: response.responseType,
          createdAt: response.submittedAt,
          level: card?.levelId || 'unknown'
        };
        
        if (card && ['choice', 'values', 'archetype', 'multiselect'].includes(card.type || '')) {
          cardResult.options = await this.getCardOptionsByCardId(response.cardId);
        }
        
        result.push(cardResult);
      }
      
      return result;
    }
  }

  async updateCardResponse(sessionId: string, cardId: string, response: any): Promise<any> {
    try {
      const result = await db
        .update(cardResponsesTable)
        .set({ response })
        .where(
          and(
            eq(cardResponsesTable.sessionId, sessionId),
            eq(cardResponsesTable.cardId, cardId)
          )
        )
        .returning();
      
      return result[0] || null;
    } catch (error) {
      console.error("Error updating card response:", error);
      return null;
    }
  }

  // =============================================================================
  // ADMIN METHODS - Only for admin users
  // =============================================================================

  async getAdminStats(): Promise<any> {
    const totalUsers = await db.select({ count: count() }).from(usersTable);
    const totalSessions = await db.select({ count: count() }).from(gameSessionsTable);
    const totalCards = await db.select({ count: count() }).from(gameCardsTable);
    const totalResponses = await db.select({ count: count() }).from(cardResponsesTable);
    
    const completedSessions = await db
      .select({ count: count() })
      .from(gameSessionsTable)
      .where(isNotNull(gameSessionsTable.completed));
    
    return {
      totalUsers: totalUsers[0]?.count || 0,
      totalSessions: totalSessions[0]?.count || 0,
      totalCards: totalCards[0]?.count || 0,
      totalResponses: totalResponses[0]?.count || 0,
      completedSessions: completedSessions[0]?.count || 0,
    };
  }

  async getAllCardsWithProperties(): Promise<GameCard[]> {
    const cards = await db
      .select()
      .from(gameCardsTable)
      .leftJoin(gameLevelsTable, eq(gameCardsTable.levelId, gameLevelsTable.id))
      .orderBy(gameCardsTable.levelId, gameCardsTable.positionX);

    const cardsWithProperties = await Promise.all(
      cards.map(async (cardRow) => {
        const card = cardRow.game_cards;
        const level = cardRow.game_levels;
        
        const properties = await db
          .select()
          .from(cardPropertiesTable)
          .where(eq(cardPropertiesTable.cardId, card.id));

        return {
          ...card,
          level,
          properties,
        };
      })
    );

    return cardsWithProperties;
  }

  async updateGameCard(cardId: string, cardData: Partial<GameCard>): Promise<GameCard> {
    // Filter out date fields, joined fields, and only include allowed update fields
    const { createdAt, updatedAt, id, level, properties, ...updateFields } = cardData as any;
    
    const [updatedCard] = await db
      .update(gameCardsTable)
      .set({ ...updateFields, updatedAt: new Date() })
      .where(eq(gameCardsTable.id, cardId))
      .returning();

    if (!updatedCard) {
      throw new Error(`Card with id ${cardId} not found`);
    }

    return updatedCard;
  }

  async createGameCard(cardData: any): Promise<GameCard> {
    const [newCard] = await db
      .insert(gameCardsTable)
      .values({
        ...cardData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return newCard;
  }

  async deleteGameCard(cardId: string): Promise<void> {
    // First delete all related properties
    await db
      .delete(cardPropertiesTable)
      .where(eq(cardPropertiesTable.cardId, cardId));

    // Delete all responses for this card
    await db
      .delete(cardResponsesTable)
      .where(eq(cardResponsesTable.cardId, cardId));

    // Delete relations
    await db
      .delete(cardRelationsTable)
      .where(or(
        eq(cardRelationsTable.fromCardId, cardId),
        eq(cardRelationsTable.toCardId, cardId)
      ));

    // Finally delete the card
    await db
      .delete(gameCardsTable)
      .where(eq(gameCardsTable.id, cardId));
  }

  async getCardProperties(cardId: string): Promise<any[]> {
    return await db
      .select()
      .from(cardPropertiesTable)
      .where(eq(cardPropertiesTable.cardId, cardId));
  }

  async updateCardProperties(cardId: string, properties: any[]): Promise<any[]> {
    // Delete existing properties
    await db
      .delete(cardPropertiesTable)
      .where(eq(cardPropertiesTable.cardId, cardId));

    // Insert new properties
    if (properties.length > 0) {
      const propertiesToInsert = properties.map(prop => ({
        ...prop,
        cardId,
        createdAt: new Date(),
      }));

      await db
        .insert(cardPropertiesTable)
        .values(propertiesToInsert);
    }

    // Return updated properties
    return this.getCardProperties(cardId);
  }

  async updateGameLevel(levelId: string, levelData: Partial<any>): Promise<any> {
    const [updatedLevel] = await db
      .update(gameLevelsTable)
      .set({ ...levelData, updatedAt: new Date() })
      .where(eq(gameLevelsTable.id, levelId))
      .returning();

    if (!updatedLevel) {
      throw new Error(`Level with id ${levelId} not found`);
    }

    return updatedLevel;
  }

  async reorderCards(cards: { id: string; positionX: number }[]): Promise<void> {
    // Update all card positions in a transaction
    for (const card of cards) {
      await db
        .update(gameCardsTable)
        .set({ 
          positionX: card.positionX,
          updatedAt: new Date() 
        })
        .where(eq(gameCardsTable.id, card.id));
    }
  }

  async normalizeCardPositions(): Promise<void> {
    // Get all cards grouped by level
    const levels = await this.getGameLevels();
    
    for (const level of levels) {
      const cards = await db
        .select()
        .from(gameCardsTable)
        .where(eq(gameCardsTable.levelId, level.id))
        .orderBy(gameCardsTable.positionX);
      
      // Update positions to be sequential starting from 1
      for (let i = 0; i < cards.length; i++) {
        await db
          .update(gameCardsTable)
          .set({ 
            positionX: i + 1,
            updatedAt: new Date() 
          })
          .where(eq(gameCardsTable.id, cards[i].id));
      }
    }
  }

  async getAllUsers(): Promise<any[]> {
    const users = await db.select().from(usersTable);
    return users;
  }

  async deleteUser(userId: string): Promise<void> {
    console.log(`Deleting user ${userId} and all related data...`);
    
    // 1. Clean up auth tokens for this user
    for (const [token, data] of this.authTokens.entries()) {
      if (data.userId === userId) {
        this.authTokens.delete(token);
      }
    }
    
    // 2. Get all user's brands
    const userBrands = await db
      .select({ id: userBrandsTable.id })
      .from(userBrandsTable)
      .where(eq(userBrandsTable.userId, userId));
    
    // 3. Get all game sessions (both direct and via brands)
    const directSessions = await db
      .select({ id: gameSessionsTable.id })
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.userId, userId));
    
    const brandIds = userBrands.map(b => b.id);
    let brandSessions: { id: string }[] = [];
    if (brandIds.length > 0) {
      brandSessions = await db
        .select({ id: gameSessionsTable.id })
        .from(gameSessionsTable)
        .where(inArray(gameSessionsTable.brandId, brandIds));
    }
    
    const allSessionIds = [...new Set([...directSessions.map(s => s.id), ...brandSessions.map(s => s.id)])];
    
    // 4. Delete card responses for all sessions
    if (allSessionIds.length > 0) {
      await db.delete(cardResponsesTable).where(inArray(cardResponsesTable.sessionId, allSessionIds));
      console.log(`Deleted card responses for ${allSessionIds.length} sessions`);
    }
    
    // 5. Delete game sessions
    if (allSessionIds.length > 0) {
      await db.delete(gameSessionsTable).where(inArray(gameSessionsTable.id, allSessionIds));
      console.log(`Deleted ${allSessionIds.length} game sessions`);
    }
    
    // 6. Delete user brands
    if (brandIds.length > 0) {
      await db.delete(userBrandsTable).where(inArray(userBrandsTable.id, brandIds));
      console.log(`Deleted ${brandIds.length} brands`);
    }
    
    // 7. Delete user profile
    await db.delete(userProfilesTable).where(eq(userProfilesTable.userId, userId));
    
    // 8. Delete user settings
    await db.delete(userSettingsTable).where(eq(userSettingsTable.userId, userId));
    
    // 9. Finally delete the user
    await db.delete(usersTable).where(eq(usersTable.id, userId));
    
    console.log(`User ${userId} and all related data deleted successfully`);
  }

  // Card option sets operations
  async getCardOptionSets(cardTypeId?: string): Promise<CardOptionSet[]> {
    if (cardTypeId) {
      return await db.select().from(cardOptionSetsTable)
        .where(and(eq(cardOptionSetsTable.cardTypeId, cardTypeId), eq(cardOptionSetsTable.isActive, true)));
    }
    return await db.select().from(cardOptionSetsTable)
      .where(eq(cardOptionSetsTable.isActive, true));
  }

  async getCardOptionSet(id: string): Promise<CardOptionSet | undefined> {
    const [optionSet] = await db.select().from(cardOptionSetsTable)
      .where(eq(cardOptionSetsTable.id, id));
    return optionSet;
  }

  async createCardOptionSet(optionSet: InsertCardOptionSet): Promise<CardOptionSet> {
    const [created] = await db.insert(cardOptionSetsTable)
      .values(optionSet)
      .returning();
    return created;
  }

  async updateCardOptionSet(id: string, updates: Partial<CardOptionSet>): Promise<CardOptionSet | undefined> {
    // Remove timestamp fields that might cause issues
    const { createdAt, updatedAt, ...cleanUpdates } = updates;
    
    const [updated] = await db.update(cardOptionSetsTable)
      .set({ ...cleanUpdates, updatedAt: new Date() })
      .where(eq(cardOptionSetsTable.id, id))
      .returning();
    return updated;
  }

  async deleteCardOptionSet(id: string): Promise<boolean> {
    const result = await db.update(cardOptionSetsTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(cardOptionSetsTable.id, id));
    return result.rowCount > 0;
  }

  // Card options operations
  async getCardOptions(optionSetId: string): Promise<CardOption[]> {
    return await db.select().from(cardOptionsTable)
      .where(and(eq(cardOptionsTable.optionSetId, optionSetId), eq(cardOptionsTable.isActive, true)))
      .orderBy(cardOptionsTable.order);
  }

  async getCardOptionsBySetId(setId: string): Promise<CardOption[]> {
    return await db.select().from(cardOptionsTable)
      .where(and(eq(cardOptionsTable.optionSetId, setId), eq(cardOptionsTable.isActive, true)))
      .orderBy(cardOptionsTable.order);
  }

  async createCardOption(option: InsertCardOption): Promise<CardOption> {
    const [created] = await db.insert(cardOptionsTable)
      .values(option)
      .returning();
    return created;
  }

  async updateCardOption(id: string, updates: Partial<CardOption>): Promise<CardOption | undefined> {
    // Remove timestamp fields that might cause issues
    const { createdAt, updatedAt, ...cleanUpdates } = updates;
    
    const [updated] = await db.update(cardOptionsTable)
      .set({ ...cleanUpdates, updatedAt: new Date() })
      .where(eq(cardOptionsTable.id, id))
      .returning();
    return updated;
  }

  async deleteCardOption(id: string): Promise<boolean> {
    const result = await db.update(cardOptionsTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(cardOptionsTable.id, id));
    return result.rowCount > 0;
  }

  // Card option set links operations
  async getCardOptionSetLinks(cardId: string): Promise<CardOptionSetLink[]> {
    return await db.select().from(cardOptionSetLinksTable)
      .where(eq(cardOptionSetLinksTable.cardId, cardId));
  }

  async createCardOptionSetLink(link: InsertCardOptionSetLink): Promise<CardOptionSetLink> {
    const [created] = await db.insert(cardOptionSetLinksTable)
      .values(link)
      .returning();
    return created;
  }

  async updateCardOptionSetLink(id: string, updates: Partial<CardOptionSetLink>): Promise<CardOptionSetLink | undefined> {
    const [updated] = await db.update(cardOptionSetLinksTable)
      .set(updates)
      .where(eq(cardOptionSetLinksTable.id, id))
      .returning();
    return updated;
  }

  async deleteCardOptionSetLink(id: string): Promise<boolean> {
    const result = await db.delete(cardOptionSetLinksTable)
      .where(eq(cardOptionSetLinksTable.id, id));
    return result.rowCount > 0;
  }

  // Get options for specific cards based on predefined mappings
  async getCardOptionsByCardId(cardId: string): Promise<CardOption[]> {
    // Mapping of card IDs to option set IDs
    const cardToOptionSetMapping: { [key: string]: string } = {
      'soul-values': 'brand-values',
      'soul-archetype': 'brand-archetypes',
      'mind-archetype': 'brand-archetypes', 
      'body-products': 'products-services',
      'body-channels': 'communication-channels',
      'body-tone': 'tone-voice',
      'body-pricing': 'pricing-strategies',
      'body-metrics': 'success-metrics'
    };

    const optionSetId = cardToOptionSetMapping[cardId];
    if (!optionSetId) {
      return [];
    }

    return await this.getCardOptions(optionSetId);
  }

  // Get all card options across all option sets
  async getAllCardOptions(): Promise<CardOption[]> {
    return await db.select().from(cardOptionsTable)
      .where(eq(cardOptionsTable.isActive, true))
      .orderBy(cardOptionsTable.optionSetId, cardOptionsTable.order);
  }

  // Load all option translations at once for efficiency
  async loadOptionTranslations(): Promise<Record<string, string>> {
    const options = await db.select()
      .from(cardOptionsTable)
      .where(eq(cardOptionsTable.isActive, true));
    
    const valueToName: Record<string, string> = {};
    options.forEach(opt => {
      valueToName[opt.value] = opt.name;
    });
    return valueToName;
  }

  // Translate values using preloaded map
  translateValuesWithMap(values: string | string[], valueToName: Record<string, string>): string | string[] {
    if (!values) return values;
    
    const valueArray = Array.isArray(values) ? values : [values];
    if (valueArray.length === 0) return values;
    
    const translated = valueArray.map(v => valueToName[v] || v);
    return Array.isArray(values) ? translated : translated[0];
  }

  // Translate a complete response object using preloaded map
  translateResponseWithMap(response: any, valueToName: Record<string, string>): any {
    if (!response) return response;
    
    // If it's a simple array of strings, translate each
    if (Array.isArray(response)) {
      const hasObjects = response.some(item => typeof item === 'object');
      if (!hasObjects) {
        return this.translateValuesWithMap(response, valueToName);
      }
      return response;
    }
    
    // If it's a simple string, try to translate
    if (typeof response === 'string') {
      return this.translateValuesWithMap(response, valueToName);
    }
    
    // If it's an object, walk known fields and translate
    if (typeof response === 'object') {
      const translated = { ...response };
      const fieldsToTranslate = [
        'selectedValues', 'archetype', 'archetypes', 'values', 'channels',
        'toneOfVoice', 'tone', 'products', 'metrics', 'pricing'
      ];
      
      for (const field of fieldsToTranslate) {
        if (translated[field]) {
          translated[field] = this.translateValuesWithMap(translated[field], valueToName);
        }
      }
      return translated;
    }
    
    return response;
  }

  // App settings operations
  async getAppSetting(key: string): Promise<AppSetting | undefined> {
    const [setting] = await db
      .select()
      .from(appSettingsTable)
      .where(eq(appSettingsTable.key, key))
      .limit(1);
    return setting;
  }

  async setAppSetting(key: string, value: string, isSecret: boolean = false, description?: string): Promise<AppSetting> {
    const existing = await this.getAppSetting(key);
    
    if (existing) {
      const [updated] = await db
        .update(appSettingsTable)
        .set({ 
          value, 
          isSecret,
          description: description || existing.description,
          updatedAt: new Date() 
        })
        .where(eq(appSettingsTable.key, key))
        .returning();
      return updated;
    }
    
    const [created] = await db
      .insert(appSettingsTable)
      .values({
        key,
        value,
        isSecret,
        description,
      })
      .returning();
    return created;
  }

  // AI Usage Logging operations
  async logAIUsage(data: InsertAiUsageLog): Promise<AiUsageLog> {
    const [log] = await db
      .insert(aiUsageLogsTable)
      .values(data)
      .returning();
    return log;
  }

  async getAIUsageLogs(limit: number = 50, offset: number = 0): Promise<(AiUsageLog & { brandName?: string })[]> {
    // Use raw SQL to handle type mismatch between uuid and varchar in join
    const logs = await db
      .select({
        id: aiUsageLogsTable.id,
        provider: aiUsageLogsTable.provider,
        model: aiUsageLogsTable.model,
        tokensInput: aiUsageLogsTable.tokensInput,
        tokensOutput: aiUsageLogsTable.tokensOutput,
        costEstimate: aiUsageLogsTable.costEstimate,
        sessionId: aiUsageLogsTable.sessionId,
        userId: aiUsageLogsTable.userId,
        endpoint: aiUsageLogsTable.endpoint,
        createdAt: aiUsageLogsTable.createdAt,
        brandName: userBrandsTable.name,
      })
      .from(aiUsageLogsTable)
      .leftJoin(gameSessionsTable, sql`${aiUsageLogsTable.sessionId}::text = ${gameSessionsTable.id}`)
      .leftJoin(userBrandsTable, eq(gameSessionsTable.brandId, userBrandsTable.id))
      .orderBy(desc(aiUsageLogsTable.createdAt))
      .limit(limit)
      .offset(offset);
    
    return logs.map(log => ({
      ...log,
      brandName: log.brandName || undefined,
    }));
  }

  async getAIUsageStats(period: 'day' | 'week' | 'month' | 'all' = 'all'): Promise<{
    totalRequests: number;
    totalTokensInput: number;
    totalTokensOutput: number;
    totalCost: string;
    byProvider: { provider: string; requests: number; tokensInput: number; tokensOutput: number }[];
  }> {
    let dateFilter;
    const now = new Date();
    
    switch (period) {
      case 'day':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = null;
    }

    let logs;
    if (dateFilter) {
      logs = await db
        .select()
        .from(aiUsageLogsTable)
        .where(gte(aiUsageLogsTable.createdAt, dateFilter));
    } else {
      logs = await db
        .select()
        .from(aiUsageLogsTable);
    }

    const totalRequests = logs.length;
    const totalTokensInput = logs.reduce((sum, log) => sum + (log.tokensInput || 0), 0);
    const totalTokensOutput = logs.reduce((sum, log) => sum + (log.tokensOutput || 0), 0);
    
    let totalCostNum = 0;
    logs.forEach(log => {
      if (log.costEstimate) {
        totalCostNum += parseFloat(log.costEstimate) || 0;
      }
    });

    const byProviderMap = new Map<string, { requests: number; tokensInput: number; tokensOutput: number }>();
    logs.forEach(log => {
      const existing = byProviderMap.get(log.provider) || { requests: 0, tokensInput: 0, tokensOutput: 0 };
      existing.requests += 1;
      existing.tokensInput += log.tokensInput || 0;
      existing.tokensOutput += log.tokensOutput || 0;
      byProviderMap.set(log.provider, existing);
    });

    const byProvider = Array.from(byProviderMap.entries()).map(([provider, stats]) => ({
      provider,
      ...stats
    }));

    return {
      totalRequests,
      totalTokensInput,
      totalTokensOutput,
      totalCost: totalCostNum.toFixed(6),
      byProvider
    };
  }

  async getNanoBananaUsageStats(): Promise<{
    totalImages: number;
    totalCost: string;
    recentLogs: (AiUsageLog & { brandName?: string })[];
  }> {
    const logs = await db
      .select({
        id: aiUsageLogsTable.id,
        provider: aiUsageLogsTable.provider,
        model: aiUsageLogsTable.model,
        tokensInput: aiUsageLogsTable.tokensInput,
        tokensOutput: aiUsageLogsTable.tokensOutput,
        costEstimate: aiUsageLogsTable.costEstimate,
        sessionId: aiUsageLogsTable.sessionId,
        userId: aiUsageLogsTable.userId,
        endpoint: aiUsageLogsTable.endpoint,
        createdAt: aiUsageLogsTable.createdAt,
        brandName: userBrandsTable.name,
      })
      .from(aiUsageLogsTable)
      .leftJoin(gameSessionsTable, sql`${aiUsageLogsTable.sessionId}::text = ${gameSessionsTable.id}`)
      .leftJoin(userBrandsTable, eq(gameSessionsTable.brandId, userBrandsTable.id))
      .where(eq(aiUsageLogsTable.provider, 'nanobanana'))
      .orderBy(desc(aiUsageLogsTable.createdAt))
      .limit(20);

    const totalImages = logs.length;
    let totalCostNum = 0;
    logs.forEach(log => {
      if (log.costEstimate) {
        totalCostNum += parseFloat(log.costEstimate) || 0;
      }
    });

    return {
      totalImages,
      totalCost: totalCostNum.toFixed(2),
      recentLogs: logs.map(log => ({
        ...log,
        brandName: log.brandName || undefined,
      })),
    };
  }

  // AI Chat Messages operations
  async getAiChatMessages(sessionId: string): Promise<AiChatMessage[]> {
    return await db
      .select()
      .from(aiChatMessagesTable)
      .where(eq(aiChatMessagesTable.sessionId, sessionId))
      .orderBy(aiChatMessagesTable.createdAt);
  }

  async addAiChatMessage(message: InsertAiChatMessage): Promise<AiChatMessage> {
    const [created] = await db
      .insert(aiChatMessagesTable)
      .values(message)
      .returning();
    return created;
  }

  async deleteAiChatMessages(sessionId: string): Promise<void> {
    await db
      .delete(aiChatMessagesTable)
      .where(eq(aiChatMessagesTable.sessionId, sessionId));
  }

  async saveChatMessage(sessionId: string, userId: string, role: string, content: string, imageUrl?: string): Promise<AiChatMessage> {
    const [created] = await db
      .insert(aiChatMessagesTable)
      .values({
        sessionId,
        userId,
        role,
        content,
        imageUrl: imageUrl || null,
      })
      .returning();
    return created;
  }

  // Brand AI Analysis operations
  async createBrandAiAnalysis(analysis: InsertBrandAiAnalysis): Promise<BrandAiAnalysis> {
    const [result] = await db
      .insert(brandAiAnalysesTable)
      .values(analysis)
      .returning();
    return result;
  }

  async getBrandAiAnalyses(brandId: string): Promise<BrandAiAnalysis[]> {
    return await db
      .select()
      .from(brandAiAnalysesTable)
      .where(eq(brandAiAnalysesTable.brandId, brandId))
      .orderBy(desc(brandAiAnalysesTable.createdAt));
  }

  async getLatestBrandAiAnalysis(brandId: string): Promise<BrandAiAnalysis | undefined> {
    const [result] = await db
      .select()
      .from(brandAiAnalysesTable)
      .where(eq(brandAiAnalysesTable.brandId, brandId))
      .orderBy(desc(brandAiAnalysesTable.createdAt))
      .limit(1);
    return result;
  }

  // Generation templates operations
  async getGenerationTemplates(): Promise<GenerationTemplate[]> {
    return await db
      .select()
      .from(generationTemplatesTable)
      .orderBy(generationTemplatesTable.sortOrder);
  }

  async getGenerationTemplate(id: number): Promise<GenerationTemplate | undefined> {
    const [result] = await db
      .select()
      .from(generationTemplatesTable)
      .where(eq(generationTemplatesTable.id, id))
      .limit(1);
    return result;
  }

  async createGenerationTemplate(template: InsertGenerationTemplate): Promise<GenerationTemplate> {
    const [result] = await db
      .insert(generationTemplatesTable)
      .values(template)
      .returning();
    return result;
  }

  async updateGenerationTemplate(id: number, updates: Partial<GenerationTemplate>): Promise<GenerationTemplate | undefined> {
    const [result] = await db
      .update(generationTemplatesTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(generationTemplatesTable.id, id))
      .returning();
    return result;
  }

  async deleteGenerationTemplate(id: number): Promise<boolean> {
    const result = await db
      .delete(generationTemplatesTable)
      .where(eq(generationTemplatesTable.id, id));
    return true;
  }

  // Merch types operations
  async getMerchTypes(): Promise<MerchType[]> {
    return await db
      .select()
      .from(merchTypesTable)
      .orderBy(merchTypesTable.sortOrder);
  }

  async getMerchType(id: number): Promise<MerchType | undefined> {
    const [result] = await db
      .select()
      .from(merchTypesTable)
      .where(eq(merchTypesTable.id, id))
      .limit(1);
    return result;
  }

  async createMerchType(merchType: InsertMerchType): Promise<MerchType> {
    const [result] = await db
      .insert(merchTypesTable)
      .values(merchType)
      .returning();
    return result;
  }

  async updateMerchType(id: number, updates: Partial<MerchType>): Promise<MerchType | undefined> {
    const [result] = await db
      .update(merchTypesTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(merchTypesTable.id, id))
      .returning();
    return result;
  }

  async deleteMerchType(id: number): Promise<boolean> {
    const result = await db
      .delete(merchTypesTable)
      .where(eq(merchTypesTable.id, id));
    return true;
  }

  async reorderMerchTypes(orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(merchTypesTable)
        .set({ sortOrder: i + 1, updatedAt: new Date() })
        .where(eq(merchTypesTable.id, orderedIds[i]));
    }
  }

  // Media assets operations
  async createMediaAsset(asset: InsertMediaAsset): Promise<MediaAsset> {
    const [result] = await db
      .insert(mediaAssetsTable)
      .values(asset)
      .returning();
    
    // Update quota usage
    if (asset.sizeBytes) {
      await this.updateQuotaUsage(asset.userId, asset.sizeBytes, 1);
    }
    
    return result;
  }

  async getMediaAsset(id: string): Promise<MediaAsset | undefined> {
    const [result] = await db
      .select()
      .from(mediaAssetsTable)
      .where(eq(mediaAssetsTable.id, id))
      .limit(1);
    return result;
  }

  async getUserMediaAssets(userId: string, assetType?: string): Promise<MediaAsset[]> {
    if (assetType) {
      return db
        .select()
        .from(mediaAssetsTable)
        .where(and(
          eq(mediaAssetsTable.userId, userId),
          eq(mediaAssetsTable.assetType, assetType)
        ))
        .orderBy(desc(mediaAssetsTable.createdAt));
    }
    return db
      .select()
      .from(mediaAssetsTable)
      .where(eq(mediaAssetsTable.userId, userId))
      .orderBy(desc(mediaAssetsTable.createdAt));
  }

  async getBrandMediaAssets(brandId: string): Promise<MediaAsset[]> {
    return db
      .select()
      .from(mediaAssetsTable)
      .where(eq(mediaAssetsTable.brandId, brandId))
      .orderBy(desc(mediaAssetsTable.createdAt));
  }

  async updateMediaAsset(id: string, updates: Partial<MediaAsset>): Promise<MediaAsset | undefined> {
    const [result] = await db
      .update(mediaAssetsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mediaAssetsTable.id, id))
      .returning();
    return result;
  }

  async deleteMediaAsset(id: string): Promise<boolean> {
    // Get asset first to update quota
    const asset = await this.getMediaAsset(id);
    if (asset) {
      await db
        .delete(mediaAssetsTable)
        .where(eq(mediaAssetsTable.id, id));
      
      // Update quota usage (negative to reduce)
      if (asset.sizeBytes) {
        await this.updateQuotaUsage(asset.userId, -asset.sizeBytes, -1);
      }
      return true;
    }
    return false;
  }

  // Media quotas operations
  async getUserMediaQuota(userId: string): Promise<UserMediaQuota | undefined> {
    const [result] = await db
      .select()
      .from(userMediaQuotasTable)
      .where(eq(userMediaQuotasTable.userId, userId))
      .limit(1);
    return result;
  }

  async createOrUpdateUserMediaQuota(userId: string, updates: Partial<UserMediaQuota>): Promise<UserMediaQuota> {
    const existing = await this.getUserMediaQuota(userId);
    
    if (existing) {
      const [result] = await db
        .update(userMediaQuotasTable)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userMediaQuotasTable.userId, userId))
        .returning();
      return result;
    }
    
    const [result] = await db
      .insert(userMediaQuotasTable)
      .values({ userId, ...updates })
      .returning();
    return result;
  }

  async updateQuotaUsage(userId: string, bytesChange: number, filesChange: number): Promise<UserMediaQuota | undefined> {
    let quota = await this.getUserMediaQuota(userId);
    
    if (!quota) {
      // Create default quota for new user
      quota = await this.createOrUpdateUserMediaQuota(userId, {});
    }
    
    const newUsedBytes = Math.max(0, (quota.usedBytes || 0) + bytesChange);
    const newUsedFiles = Math.max(0, (quota.usedFiles || 0) + filesChange);
    
    const [result] = await db
      .update(userMediaQuotasTable)
      .set({
        usedBytes: newUsedBytes,
        usedFiles: newUsedFiles,
        updatedAt: new Date()
      })
      .where(eq(userMediaQuotasTable.userId, userId))
      .returning();
    
    return result;
  }

  async checkQuotaAvailable(userId: string, bytesToAdd: number): Promise<boolean> {
    let quota = await this.getUserMediaQuota(userId);
    
    if (!quota) {
      // Create default quota for new user
      quota = await this.createOrUpdateUserMediaQuota(userId, {});
    }
    
    const hasSpaceBytes = (quota.usedBytes || 0) + bytesToAdd <= (quota.maxTotalBytes || 104857600);
    const hasSpaceFiles = (quota.usedFiles || 0) + 1 <= (quota.maxFiles || 100);
    
    return hasSpaceBytes && hasSpaceFiles;
  }

  // ============================================
  // Subscription plans operations
  // ============================================
  
  async getSubscriptionPlans(activeOnly: boolean = true): Promise<SubscriptionPlan[]> {
    if (activeOnly) {
      return await db
        .select()
        .from(subscriptionPlansTable)
        .where(eq(subscriptionPlansTable.isActive, true))
        .orderBy(subscriptionPlansTable.sortOrder);
    }
    return await db
      .select()
      .from(subscriptionPlansTable)
      .orderBy(subscriptionPlansTable.sortOrder);
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [result] = await db
      .select()
      .from(subscriptionPlansTable)
      .where(eq(subscriptionPlansTable.id, id))
      .limit(1);
    return result;
  }

  async getDefaultSubscriptionPlan(): Promise<SubscriptionPlan | undefined> {
    const [result] = await db
      .select()
      .from(subscriptionPlansTable)
      .where(and(
        eq(subscriptionPlansTable.isDefault, true),
        eq(subscriptionPlansTable.isActive, true)
      ))
      .limit(1);
    return result;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [result] = await db
      .insert(subscriptionPlansTable)
      .values(plan)
      .returning();
    return result;
  }

  async updateSubscriptionPlan(id: number, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const [result] = await db
      .update(subscriptionPlansTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptionPlansTable.id, id))
      .returning();
    return result;
  }

  async deleteSubscriptionPlan(id: number): Promise<boolean> {
    const result = await db
      .delete(subscriptionPlansTable)
      .where(eq(subscriptionPlansTable.id, id));
    return true;
  }

  // ============================================
  // User subscriptions operations
  // ============================================
  
  async getUserSubscription(userId: string): Promise<UserSubscription | undefined> {
    const [result] = await db
      .select()
      .from(userSubscriptionsTable)
      .where(and(
        eq(userSubscriptionsTable.userId, userId),
        eq(userSubscriptionsTable.status, 'active')
      ))
      .orderBy(desc(userSubscriptionsTable.createdAt))
      .limit(1);
    return result;
  }

  async getUserSubscriptionWithPlan(userId: string): Promise<{ subscription: UserSubscription; plan: SubscriptionPlan } | undefined> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      // If no subscription, return default plan
      const defaultPlan = await this.getDefaultSubscriptionPlan();
      if (defaultPlan) {
        // Create subscription on default plan
        const newSub = await this.createUserSubscription({
          userId,
          planId: defaultPlan.id,
          billingPeriod: 'monthly',
          status: 'active',
        });
        return { subscription: newSub, plan: defaultPlan };
      }
      return undefined;
    }
    
    const plan = await this.getSubscriptionPlan(subscription.planId);
    if (!plan) return undefined;
    
    return { subscription, plan };
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    // Cancel any existing active subscription first
    await db
      .update(userSubscriptionsTable)
      .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
      .where(and(
        eq(userSubscriptionsTable.userId, subscription.userId),
        eq(userSubscriptionsTable.status, 'active')
      ));
    
    const [result] = await db
      .insert(userSubscriptionsTable)
      .values(subscription)
      .returning();
    
    // Update media quota based on plan
    const plan = await this.getSubscriptionPlan(subscription.planId);
    if (plan) {
      await this.createOrUpdateUserMediaQuota(subscription.userId, {
        maxTotalBytes: plan.maxStorageBytes,
        maxFiles: plan.maxMediaFiles,
      });
    }
    
    return result;
  }

  async updateUserSubscription(userId: string, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined> {
    const [result] = await db
      .update(userSubscriptionsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(userSubscriptionsTable.userId, userId),
        eq(userSubscriptionsTable.status, 'active')
      ))
      .returning();
    return result;
  }

  async cancelUserSubscription(userId: string): Promise<UserSubscription | undefined> {
    const [result] = await db
      .update(userSubscriptionsTable)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(userSubscriptionsTable.userId, userId),
        eq(userSubscriptionsTable.status, 'active')
      ))
      .returning();
    return result;
  }

  // ============================================
  // Quota checking for subscriptions
  // ============================================
  
  async getUserQuotas(userId: string): Promise<{ maxBrands: number; maxTotalGames: number; usedBrands: number; usedGames: number }> {
    const subWithPlan = await this.getUserSubscriptionWithPlan(userId);
    
    const maxBrands = subWithPlan?.plan?.maxBrands || 1;
    const maxTotalGames = subWithPlan?.plan?.maxTotalGames || 1;
    
    // Count user's brands
    const brands = await this.getUserBrands(userId);
    const usedBrands = brands.length;
    
    // Count user's games across all brands
    const sessions = await this.getUserGameSessions(userId);
    const usedGames = sessions.length;
    
    return { maxBrands, maxTotalGames, usedBrands, usedGames };
  }

  async canCreateBrand(userId: string): Promise<boolean> {
    const quotas = await this.getUserQuotas(userId);
    return quotas.usedBrands < quotas.maxBrands;
  }

  async canCreateGame(userId: string): Promise<boolean> {
    const quotas = await this.getUserQuotas(userId);
    return quotas.usedGames < quotas.maxTotalGames;
  }

  // ============================================
  // Payment history operations
  // ============================================
  
  async createPaymentHistory(payment: InsertPaymentHistory): Promise<PaymentHistory> {
    const [result] = await db
      .insert(paymentHistoryTable)
      .values(payment)
      .returning();
    return result;
  }

  async getUserPaymentHistory(userId: string): Promise<PaymentHistory[]> {
    return await db
      .select()
      .from(paymentHistoryTable)
      .where(eq(paymentHistoryTable.userId, userId))
      .orderBy(desc(paymentHistoryTable.createdAt));
  }

  async getPaymentByMonoInvoiceId(invoiceId: string): Promise<PaymentHistory | undefined> {
    const [result] = await db
      .select()
      .from(paymentHistoryTable)
      .where(eq(paymentHistoryTable.monoInvoiceId, invoiceId))
      .limit(1);
    return result;
  }

  async getPaymentByMonoReference(reference: string): Promise<PaymentHistory | undefined> {
    const [result] = await db
      .select()
      .from(paymentHistoryTable)
      .where(eq(paymentHistoryTable.monoReference, reference))
      .limit(1);
    return result;
  }

  async updatePaymentByMonoInvoiceId(invoiceId: string, updates: Partial<PaymentHistory>): Promise<PaymentHistory | undefined> {
    const [result] = await db
      .update(paymentHistoryTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentHistoryTable.monoInvoiceId, invoiceId))
      .returning();
    return result;
  }

  async updatePaymentById(id: string, updates: Partial<PaymentHistory>): Promise<PaymentHistory | undefined> {
    const [result] = await db
      .update(paymentHistoryTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentHistoryTable.id, id))
      .returning();
    return result;
  }

  async getAllPayments(limit: number = 50, offset: number = 0): Promise<{ payments: PaymentHistory[]; total: number }> {
    const payments = await db
      .select()
      .from(paymentHistoryTable)
      .orderBy(desc(paymentHistoryTable.createdAt))
      .limit(limit)
      .offset(offset);
    
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(paymentHistoryTable);
    
    return { payments, total: count };
  }

  // ============================================
  // Premium features operations
  // ============================================
  
  async getPremiumFeatures(activeOnly: boolean = true): Promise<PremiumFeature[]> {
    if (activeOnly) {
      return await db
        .select()
        .from(premiumFeaturesTable)
        .where(eq(premiumFeaturesTable.isActive, true));
    }
    return await db.select().from(premiumFeaturesTable);
  }

  async createPremiumFeature(feature: InsertPremiumFeature): Promise<PremiumFeature> {
    const [result] = await db
      .insert(premiumFeaturesTable)
      .values(feature)
      .returning();
    return result;
  }

  async updatePremiumFeature(id: number, updates: Partial<PremiumFeature>): Promise<PremiumFeature | undefined> {
    const [result] = await db
      .update(premiumFeaturesTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(premiumFeaturesTable.id, id))
      .returning();
    return result;
  }

  async deletePremiumFeature(id: number): Promise<boolean> {
    await db
      .delete(premiumFeaturesTable)
      .where(eq(premiumFeaturesTable.id, id));
    return true;
  }

  async seedSubscriptionPlans(): Promise<void> {
    const existingPlans = await this.getSubscriptionPlans(false);
    if (existingPlans.length > 0) {
      console.log(`Subscription plans already exist (${existingPlans.length} plans), skipping seed`);
      return;
    }

    console.log('Seeding subscription plans...');

    const defaultPlans: InsertSubscriptionPlan[] = [
      {
        name: 'free',
        displayName: 'Безкоштовний',
        description: 'Ідеально для знайомства з платформою',
        priceMonthly: 0,
        priceYearly: 0,
        currency: 'UAH',
        maxBrands: 1,
        maxGamesPerBrand: 1,
        maxTotalGames: 1,
        maxStorageBytes: 52428800, // 50MB
        maxMediaFiles: 50,
        features: ['basic_game'],
        isDefault: true,
        isActive: true,
        sortOrder: 0,
        color: '#6b7280',
        icon: 'gift',
      },
      {
        name: 'basic',
        displayName: 'Базовий',
        description: 'Для початківців та малого бізнесу',
        priceMonthly: 29900, // 299 UAH
        priceYearly: 299000, // 2990 UAH
        currency: 'UAH',
        maxBrands: 5,
        maxGamesPerBrand: 10,
        maxTotalGames: 50,
        maxStorageBytes: 209715200, // 200MB
        maxMediaFiles: 200,
        features: ['basic_game', 'ai_chat', 'export_pdf', 'Мерч-генератор'],
        isDefault: false,
        isActive: true,
        sortOrder: 1,
        color: '#3b82f6',
        icon: 'zap',
      },
      {
        name: 'pro',
        displayName: 'Професійний',
        description: 'Повний доступ до всіх можливостей',
        priceMonthly: 59900, // 599 UAH
        priceYearly: 599000, // 5990 UAH
        currency: 'UAH',
        maxBrands: 25,
        maxGamesPerBrand: 10,
        maxTotalGames: 100,
        maxStorageBytes: 524288000, // 500MB
        maxMediaFiles: 500,
        features: ['basic_game', 'ai_chat', 'export_pdf', 'image_generation', 'priority_support'],
        isDefault: false,
        isActive: true,
        sortOrder: 2,
        color: '#8b5cf6',
        icon: 'crown',
        badge: 'popular',
      },
    ];

    for (const plan of defaultPlans) {
      await this.createSubscriptionPlan(plan);
    }

    console.log(`Seeded ${defaultPlans.length} subscription plans`);
  }

  // ============================================
  // Recurring billing operations
  // ============================================

  async getSubscriptionsDueForBilling(): Promise<UserSubscription[]> {
    const now = new Date();
    return await db
      .select()
      .from(userSubscriptionsTable)
      .where(and(
        eq(userSubscriptionsTable.status, 'active'),
        lte(userSubscriptionsTable.nextPaymentAt, now),
        isNotNull(userSubscriptionsTable.nextPaymentAt)
      ));
  }

  async getExpiredGracePeriodSubscriptions(): Promise<UserSubscription[]> {
    const now = new Date();
    return await db
      .select()
      .from(userSubscriptionsTable)
      .where(and(
        eq(userSubscriptionsTable.status, 'past_due'),
        lte(userSubscriptionsTable.billingGraceUntil, now),
        isNotNull(userSubscriptionsTable.billingGraceUntil)
      ));
  }

  async getActiveMonobankSubscriptions(): Promise<UserSubscription[]> {
    return await db
      .select()
      .from(userSubscriptionsTable)
      .where(and(
        eq(userSubscriptionsTable.status, 'active'),
        isNotNull(userSubscriptionsTable.monoSubscriptionId)
      ));
  }

  async updateSubscriptionBillingAttempt(subscriptionId: string, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined> {
    const [result] = await db
      .update(userSubscriptionsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSubscriptionsTable.id, subscriptionId))
      .returning();
    return result;
  }

  async updateSubscription(subscriptionId: string, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined> {
    const [result] = await db
      .update(userSubscriptionsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSubscriptionsTable.id, subscriptionId))
      .returning();
    return result;
  }

  async getDefaultFreePlan(): Promise<SubscriptionPlan | undefined> {
    const [result] = await db
      .select()
      .from(subscriptionPlansTable)
      .where(and(
        eq(subscriptionPlansTable.priceMonthly, 0),
        eq(subscriptionPlansTable.isActive, true)
      ))
      .limit(1);
    return result;
  }

  async getUser(userId: string): Promise<User | undefined> {
    return this.getUserById(userId);
  }

  // ============================================
  // External brand analysis operations
  // ============================================

  async createExternalBrandAnalysis(analysis: InsertExternalBrandAnalysis): Promise<ExternalBrandAnalysis> {
    const [result] = await db
      .insert(externalBrandAnalysesTable)
      .values(analysis)
      .returning();
    return result;
  }

  async getExternalBrandAnalyses(userId: string): Promise<ExternalBrandAnalysis[]> {
    return await db
      .select()
      .from(externalBrandAnalysesTable)
      .where(eq(externalBrandAnalysesTable.userId, userId))
      .orderBy(desc(externalBrandAnalysesTable.createdAt));
  }

  async getExternalBrandAnalysis(id: string): Promise<ExternalBrandAnalysis | undefined> {
    const [result] = await db
      .select()
      .from(externalBrandAnalysesTable)
      .where(eq(externalBrandAnalysesTable.id, id));
    return result;
  }

  async updateExternalBrandAnalysis(id: string, updates: Partial<ExternalBrandAnalysis>): Promise<ExternalBrandAnalysis | undefined> {
    const [result] = await db
      .update(externalBrandAnalysesTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalBrandAnalysesTable.id, id))
      .returning();
    return result;
  }

  async deleteExternalBrandAnalysis(id: string): Promise<boolean> {
    const result = await db
      .delete(externalBrandAnalysesTable)
      .where(eq(externalBrandAnalysesTable.id, id));
    return true;
  }

  // ============================================
  // Brand analysis settings operations (admin)
  // ============================================

  async getBrandAnalysisSettings(): Promise<BrandAnalysisSetting[]> {
    return await db
      .select()
      .from(brandAnalysisSettingsTable)
      .orderBy(brandAnalysisSettingsTable.category);
  }

  async getBrandAnalysisSetting(key: string): Promise<BrandAnalysisSetting | undefined> {
    const [result] = await db
      .select()
      .from(brandAnalysisSettingsTable)
      .where(eq(brandAnalysisSettingsTable.key, key));
    return result;
  }

  async updateBrandAnalysisSetting(key: string, value: string): Promise<BrandAnalysisSetting | undefined> {
    const [result] = await db
      .update(brandAnalysisSettingsTable)
      .set({ value, updatedAt: new Date() })
      .where(eq(brandAnalysisSettingsTable.key, key))
      .returning();
    return result;
  }

  async createBrandAnalysisSetting(setting: InsertBrandAnalysisSetting): Promise<BrandAnalysisSetting> {
    const [result] = await db
      .insert(brandAnalysisSettingsTable)
      .values(setting)
      .returning();
    return result;
  }

  // ============================================
  // Brand analysis templates operations
  // ============================================

  async getBrandAnalysisTemplates(): Promise<BrandAnalysisTemplate[]> {
    return await db
      .select()
      .from(brandAnalysisTemplatesTable)
      .orderBy(desc(brandAnalysisTemplatesTable.isDefault), brandAnalysisTemplatesTable.name);
  }

  async getBrandAnalysisTemplate(id: number): Promise<BrandAnalysisTemplate | undefined> {
    const [result] = await db
      .select()
      .from(brandAnalysisTemplatesTable)
      .where(eq(brandAnalysisTemplatesTable.id, id));
    return result;
  }

  async getDefaultBrandAnalysisTemplate(): Promise<BrandAnalysisTemplate | undefined> {
    const [result] = await db
      .select()
      .from(brandAnalysisTemplatesTable)
      .where(and(
        eq(brandAnalysisTemplatesTable.isDefault, true),
        eq(brandAnalysisTemplatesTable.isActive, true)
      ));
    return result;
  }

  async createBrandAnalysisTemplate(template: InsertBrandAnalysisTemplate): Promise<BrandAnalysisTemplate> {
    const [result] = await db
      .insert(brandAnalysisTemplatesTable)
      .values(template)
      .returning();
    return result;
  }

  async updateBrandAnalysisTemplate(id: number, updates: Partial<BrandAnalysisTemplate>): Promise<BrandAnalysisTemplate | undefined> {
    const [result] = await db
      .update(brandAnalysisTemplatesTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(brandAnalysisTemplatesTable.id, id))
      .returning();
    return result;
  }

  async deleteBrandAnalysisTemplate(id: number): Promise<boolean> {
    const result = await db
      .delete(brandAnalysisTemplatesTable)
      .where(eq(brandAnalysisTemplatesTable.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async setDefaultBrandAnalysisTemplate(id: number): Promise<boolean> {
    await db
      .update(brandAnalysisTemplatesTable)
      .set({ isDefault: false, updatedAt: new Date() });
    
    const [result] = await db
      .update(brandAnalysisTemplatesTable)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(brandAnalysisTemplatesTable.id, id))
      .returning();
    
    return !!result;
  }

  // Target audience operations
  async getTargetAudiences(brandId: string): Promise<TargetAudience[]> {
    const results = await db
      .select()
      .from(targetAudiencesTable)
      .where(eq(targetAudiencesTable.brandId, brandId))
      .orderBy(targetAudiencesTable.priority);
    return results;
  }

  async getTargetAudience(id: string): Promise<TargetAudience | undefined> {
    const [result] = await db
      .select()
      .from(targetAudiencesTable)
      .where(eq(targetAudiencesTable.id, id));
    return result;
  }

  async createTargetAudience(audience: InsertTargetAudience): Promise<TargetAudience> {
    const [result] = await db
      .insert(targetAudiencesTable)
      .values(audience)
      .returning();
    return result;
  }

  async updateTargetAudience(id: string, updates: Partial<TargetAudience>): Promise<TargetAudience | undefined> {
    const [result] = await db
      .update(targetAudiencesTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(targetAudiencesTable.id, id))
      .returning();
    return result;
  }

  async deleteTargetAudience(id: string): Promise<boolean> {
    const result = await db
      .delete(targetAudiencesTable)
      .where(eq(targetAudiencesTable.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Audience segment operations
  async getAudienceSegments(audienceId: string): Promise<AudienceSegment[]> {
    const results = await db
      .select()
      .from(audienceSegmentsTable)
      .where(eq(audienceSegmentsTable.audienceId, audienceId))
      .orderBy(audienceSegmentsTable.priority);
    return results;
  }

  async getAudienceSegment(id: string): Promise<AudienceSegment | undefined> {
    const [result] = await db
      .select()
      .from(audienceSegmentsTable)
      .where(eq(audienceSegmentsTable.id, id));
    return result;
  }

  async createAudienceSegment(segment: InsertAudienceSegment): Promise<AudienceSegment> {
    const [result] = await db
      .insert(audienceSegmentsTable)
      .values(segment)
      .returning();
    return result;
  }

  async updateAudienceSegment(id: string, updates: Partial<AudienceSegment>): Promise<AudienceSegment | undefined> {
    const [result] = await db
      .update(audienceSegmentsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(audienceSegmentsTable.id, id))
      .returning();
    return result;
  }

  async deleteAudienceSegment(id: string): Promise<boolean> {
    const result = await db
      .delete(audienceSegmentsTable)
      .where(eq(audienceSegmentsTable.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // Demographic segment operations (new)
  async getDemographicSegments(brandId: string): Promise<DemographicSegment[]> {
    const results = await db
      .select()
      .from(demographicSegmentsTable)
      .where(eq(demographicSegmentsTable.brandId, brandId))
      .orderBy(demographicSegmentsTable.priority);
    return results;
  }

  async getDemographicSegment(id: string): Promise<DemographicSegment | undefined> {
    const [result] = await db
      .select()
      .from(demographicSegmentsTable)
      .where(eq(demographicSegmentsTable.id, id));
    return result;
  }

  async createDemographicSegment(segment: InsertDemographicSegment): Promise<DemographicSegment> {
    const [result] = await db
      .insert(demographicSegmentsTable)
      .values(segment)
      .returning();
    return result;
  }

  async updateDemographicSegment(id: string, updates: Partial<DemographicSegment>): Promise<DemographicSegment | undefined> {
    const [result] = await db
      .update(demographicSegmentsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(demographicSegmentsTable.id, id))
      .returning();
    return result;
  }

  async deleteDemographicSegment(id: string): Promise<boolean> {
    const result = await db
      .delete(demographicSegmentsTable)
      .where(eq(demographicSegmentsTable.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // Demographic sub-segment operations
  async getDemographicSubSegments(segmentId: string): Promise<DemographicSubSegment[]> {
    const results = await db
      .select()
      .from(demographicSubSegmentsTable)
      .where(eq(demographicSubSegmentsTable.segmentId, segmentId))
      .orderBy(demographicSubSegmentsTable.priority);
    return results;
  }

  async getDemographicSubSegment(id: string): Promise<DemographicSubSegment | undefined> {
    const [result] = await db
      .select()
      .from(demographicSubSegmentsTable)
      .where(eq(demographicSubSegmentsTable.id, id));
    return result;
  }

  async createDemographicSubSegment(subSegment: InsertDemographicSubSegment): Promise<DemographicSubSegment> {
    const [result] = await db
      .insert(demographicSubSegmentsTable)
      .values(subSegment)
      .returning();
    return result;
  }

  async updateDemographicSubSegment(id: string, updates: Partial<DemographicSubSegment>): Promise<DemographicSubSegment | undefined> {
    const [result] = await db
      .update(demographicSubSegmentsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(demographicSubSegmentsTable.id, id))
      .returning();
    return result;
  }

  async deleteDemographicSubSegment(id: string): Promise<boolean> {
    const result = await db
      .delete(demographicSubSegmentsTable)
      .where(eq(demographicSubSegmentsTable.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async seedAudienceTypes(): Promise<void> {
    const existingCategories = await db.select().from(audienceTypeCategoriesTable);
    if (existingCategories.length > 0) {
      console.log(`Audience type categories already exist (${existingCategories.length} categories), skipping seed`);
      return;
    }

    console.log('Seeding audience type categories and types...');

    const categories = [
      { name: 'За пріоритетністю', nameEn: 'By Priority', icon: 'Star', color: '#f59e0b', sortOrder: 0 },
      { name: 'За рівнем залученості', nameEn: 'By Engagement Level', icon: 'Target', color: '#10b981', sortOrder: 1 },
      { name: 'За роллю у прийнятті рішення', nameEn: 'By Decision Role', icon: 'Users', color: '#6366f1', sortOrder: 2 },
      { name: 'За поведінкою', nameEn: 'By Behavior', icon: 'Zap', color: '#ec4899', sortOrder: 3 },
      { name: 'За стадією шляху клієнта', nameEn: 'Customer Journey Stage', icon: 'ArrowRight', color: '#8b5cf6', sortOrder: 4 },
      { name: 'За контекстом використання', nameEn: 'By Usage Context', icon: 'Briefcase', color: '#0ea5e9', sortOrder: 5 },
      { name: 'За цінністю для бізнесу', nameEn: 'By Business Value', icon: 'DollarSign', color: '#22c55e', sortOrder: 6 },
      { name: 'За культурною роллю', nameEn: 'By Cultural Role', icon: 'Heart', color: '#f43f5e', sortOrder: 7 },
    ];

    const typesData: Record<string, Array<{ name: string; nameEn: string; color: string; sortOrder: number }>> = {
      'За пріоритетністю': [
        { name: 'Основна', nameEn: 'Primary', color: '#f59e0b', sortOrder: 0 },
        { name: 'Вторинна', nameEn: 'Secondary', color: '#eab308', sortOrder: 1 },
        { name: 'Нішева', nameEn: 'Niche', color: '#ca8a04', sortOrder: 2 },
      ],
      'За рівнем залученості': [
        { name: 'Ядро', nameEn: 'Core Audience', color: '#10b981', sortOrder: 0 },
        { name: 'Потенційна', nameEn: 'Potential', color: '#34d399', sortOrder: 1 },
        { name: 'Холодна', nameEn: 'Cold', color: '#6ee7b7', sortOrder: 2 },
        { name: 'Втрачена', nameEn: 'Lost', color: '#a7f3d0', sortOrder: 3 },
      ],
      'За роллю у прийнятті рішення': [
        { name: 'Користувачі', nameEn: 'Users', color: '#6366f1', sortOrder: 0 },
        { name: 'Платники', nameEn: 'Payers', color: '#818cf8', sortOrder: 1 },
        { name: 'Ініціатори', nameEn: 'Initiators', color: '#a5b4fc', sortOrder: 2 },
        { name: 'Інфлюенсери', nameEn: 'Influencers', color: '#c7d2fe', sortOrder: 3 },
        { name: 'Decision makers', nameEn: 'Decision Makers', color: '#4f46e5', sortOrder: 4 },
      ],
      'За поведінкою': [
        { name: 'Раціональна', nameEn: 'Rational', color: '#ec4899', sortOrder: 0 },
        { name: 'Емоційна', nameEn: 'Emotional', color: '#f472b6', sortOrder: 1 },
        { name: 'Імпульсивна', nameEn: 'Impulsive', color: '#f9a8d4', sortOrder: 2 },
        { name: 'Лояльна', nameEn: 'Loyal', color: '#fbcfe8', sortOrder: 3 },
        { name: 'Нелояльна', nameEn: 'Disloyal', color: '#db2777', sortOrder: 4 },
        { name: 'Цінові мисливці', nameEn: 'Price Hunters', color: '#be185d', sortOrder: 5 },
      ],
      'За стадією шляху клієнта': [
        { name: 'Awareness', nameEn: 'Awareness', color: '#8b5cf6', sortOrder: 0 },
        { name: 'Consideration', nameEn: 'Consideration', color: '#a78bfa', sortOrder: 1 },
        { name: 'Decision', nameEn: 'Decision', color: '#c4b5fd', sortOrder: 2 },
        { name: 'Retention', nameEn: 'Retention', color: '#ddd6fe', sortOrder: 3 },
        { name: 'Advocacy', nameEn: 'Advocacy', color: '#7c3aed', sortOrder: 4 },
      ],
      'За контекстом використання': [
        { name: 'B2C', nameEn: 'B2C', color: '#0ea5e9', sortOrder: 0 },
        { name: 'B2B', nameEn: 'B2B', color: '#38bdf8', sortOrder: 1 },
        { name: 'B2G', nameEn: 'B2G', color: '#7dd3fc', sortOrder: 2 },
        { name: 'Масова', nameEn: 'Mass Market', color: '#bae6fd', sortOrder: 3 },
        { name: 'Професійна', nameEn: 'Professional', color: '#0284c7', sortOrder: 4 },
        { name: 'Early adopters', nameEn: 'Early Adopters', color: '#0369a1', sortOrder: 5 },
      ],
      'За цінністю для бізнесу': [
        { name: 'High LTV', nameEn: 'High LTV', color: '#22c55e', sortOrder: 0 },
        { name: 'Low LTV', nameEn: 'Low LTV', color: '#86efac', sortOrder: 1 },
        { name: 'Стратегічна', nameEn: 'Strategic', color: '#4ade80', sortOrder: 2 },
        { name: 'Транзакційна', nameEn: 'Transactional', color: '#bbf7d0', sortOrder: 3 },
      ],
      'За культурною роллю': [
        { name: "Ком'юніті", nameEn: 'Community', color: '#f43f5e', sortOrder: 0 },
        { name: 'Субкультура', nameEn: 'Subculture', color: '#fb7185', sortOrder: 1 },
        { name: 'Місіонерська', nameEn: 'Missionary', color: '#fda4af', sortOrder: 2 },
        { name: 'Скептична', nameEn: 'Skeptical', color: '#fecdd3', sortOrder: 3 },
      ],
    };

    for (const cat of categories) {
      const [insertedCat] = await db.insert(audienceTypeCategoriesTable).values({
        name: cat.name,
        nameEn: cat.nameEn,
        icon: cat.icon,
        color: cat.color,
        sortOrder: cat.sortOrder,
      }).returning();

      const types = typesData[cat.name] || [];
      for (const t of types) {
        await db.insert(audienceTypesTable).values({
          categoryId: insertedCat.id,
          name: t.name,
          nameEn: t.nameEn,
          color: t.color,
          sortOrder: t.sortOrder,
        });
      }
    }

    console.log(`Seeded ${categories.length} audience categories with types`);
  }

  // Brand products operations
  async getBrandProducts(brandId: string): Promise<BrandProduct[]> {
    return await db
      .select()
      .from(brandProductsTable)
      .where(eq(brandProductsTable.brandId, brandId))
      .orderBy(brandProductsTable.sortOrder);
  }

  async getBrandProduct(id: string): Promise<BrandProduct | undefined> {
    const [product] = await db
      .select()
      .from(brandProductsTable)
      .where(eq(brandProductsTable.id, id));
    return product;
  }

  async createBrandProduct(product: InsertBrandProduct): Promise<BrandProduct> {
    const [newProduct] = await db
      .insert(brandProductsTable)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateBrandProduct(id: string, updates: Partial<BrandProduct>): Promise<BrandProduct | undefined> {
    const [updated] = await db
      .update(brandProductsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(brandProductsTable.id, id))
      .returning();
    return updated;
  }

  async deleteBrandProduct(id: string): Promise<boolean> {
    const result = await db
      .delete(brandProductsTable)
      .where(eq(brandProductsTable.id, id));
    return true;
  }

  // Product categories operations
  async getProductCategories(brandId: string): Promise<ProductCategory[]> {
    return await db
      .select()
      .from(productCategoriesTable)
      .where(eq(productCategoriesTable.brandId, brandId))
      .orderBy(productCategoriesTable.sortOrder);
  }

  async getProductCategory(id: string): Promise<ProductCategory | undefined> {
    const [category] = await db
      .select()
      .from(productCategoriesTable)
      .where(eq(productCategoriesTable.id, id));
    return category;
  }

  async createProductCategory(category: InsertProductCategory): Promise<ProductCategory> {
    const [newCategory] = await db
      .insert(productCategoriesTable)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateProductCategory(id: string, updates: Partial<ProductCategory>): Promise<ProductCategory | undefined> {
    const [updated] = await db
      .update(productCategoriesTable)
      .set(updates)
      .where(eq(productCategoriesTable.id, id))
      .returning();
    return updated;
  }

  async deleteProductCategory(id: string): Promise<boolean> {
    await db
      .delete(productCategoriesTable)
      .where(eq(productCategoriesTable.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();