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
  gameSessionsTable,
  cardResponsesTable,
  gameCardsTable,
  gameLevelsTable,
  usersTable,
  userSettingsTable,
  userBrandsTable,
  userProfilesTable,
  cardPropertiesTable,
} from "@shared/schema";
import { db } from "./db";
import { eq, count, sql, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User authentication operations
  createUser(userData: { email: string; firstName?: string | null; lastName?: string | null; password: string }): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  updateUserLoginTime(id: string): Promise<void>;
  
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
  deleteUserBrand(id: string): Promise<boolean>;
  
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
      
    // Create default user settings and profile
    await this.createUserSettings({ userId: user.id });
    await this.createUserProfile({ userId: user.id });
    
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
    return await db
      .select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.userId, userId))
      .orderBy(gameSessionsTable.createdAt);
  }

  async getUserStats(userId: string): Promise<{totalXp: number; totalGames: number; completedGames: number}> {
    // Спочатку отримаємо всі сесії користувача
    const sessions = await this.getUserGameSessions(userId);
    
    // Потім для кожної сесії підрахуємо загальний XP з відповідей
    let totalXpFromAllSessions = 0;
    
    for (const session of sessions) {
      const responses = await this.getCardResponses(session.id);
      const sessionXpFromResponses = responses.reduce((sum, response) => {
        return sum + (response.earnedXp || 0);
      }, 0);
      
      // Використовуємо максимум між збереженим totalXp та розрахованим
      const sessionTotalXp = Math.max(session.totalXp || 0, sessionXpFromResponses);
      totalXpFromAllSessions += sessionTotalXp;
    }
    
    const totalGames = sessions.length;
    const completedGames = sessions.filter(s => s.completed).length;
    
    return {
      totalXp: totalXpFromAllSessions,
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
      return sum + (response.earnedXp || 0);
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

  async getSessionCardResponses(sessionId: string): Promise<any[]> {
    try {
      const responses = await db
        .select({
          cardId: cardResponsesTable.cardId,
          cardTitle: gameCardsTable.title,
          response: cardResponsesTable.response,
          responseType: cardResponsesTable.responseType,
          createdAt: cardResponsesTable.submittedAt,
          level: gameCardsTable.levelId
        })
        .from(cardResponsesTable)
        .innerJoin(gameCardsTable, eq(cardResponsesTable.cardId, gameCardsTable.id))
        .where(eq(cardResponsesTable.sessionId, sessionId))
        .orderBy(gameCardsTable.positionX);
      
      return responses;
    } catch (error) {
      console.error("Error in getSessionCardResponses:", error);
      // Fallback to simple responses without join
      const simpleResponses = await db
        .select()
        .from(cardResponsesTable)
        .where(eq(cardResponsesTable.sessionId, sessionId));
      
      // Manually get card titles
      const result = [];
      for (const response of simpleResponses) {
        const card = await this.getGameCard(response.cardId);
        result.push({
          cardId: response.cardId,
          cardTitle: card?.title || response.cardId,
          response: response.response,
          responseType: response.responseType,
          createdAt: response.submittedAt,
          level: card?.levelId || 'unknown'
        });
      }
      
      return result;
    }
  }

}

export const storage = new DatabaseStorage();