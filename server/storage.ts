import { 
  type GameSession, 
  type InsertGameSession, 
  type BrandMap,
  type GameCard,
  type GameLevel,
  type CardResponse,
  type InsertCardResponse,
  gameSessionsTable,
  cardResponsesTable,
  gameCardsTable,
  gameLevelsTable,
} from "@shared/schema";
import { db } from "./db";
import { eq, count, sql } from "drizzle-orm";

export interface IStorage {
  // Game session CRUD operations
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getGameSession(id: string): Promise<GameSession | undefined>;
  updateGameSession(id: string, sessionId: string, updates: Partial<GameSession>): Promise<GameSession | undefined>;
  deleteGameSession(id: string): Promise<boolean>;
  
  // Game progress operations
  saveCardResponse(sessionId: string, cardId: string, response: any, responseType: string): Promise<GameSession | undefined>;
  getCardResponses(sessionId: string): Promise<CardResponse[]>;
  getGameProgress(sessionId: string): Promise<{ progress: number; currentLevel: string; currentCard: string } | undefined>;
  generateBrandMap(sessionId: string): Promise<BrandMap | undefined>;
  
  // Game data operations
  getGameCards(levelId?: string): Promise<GameCard[]>;
  getGameLevels(): Promise<GameLevel[]>;
}

export class DatabaseStorage implements IStorage {
  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
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
    return session || undefined;
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
    const result = await db
      .delete(gameSessionsTable)
      .where(eq(gameSessionsTable.id, id));
    return result.rowCount > 0;
  }

  async saveCardResponse(sessionId: string, cardId: string, response: any, responseType: string): Promise<GameSession | undefined> {
    // Save individual card response with upsert logic
    await db
      .insert(cardResponsesTable)
      .values({
        sessionId,
        cardId,
        response,
        responseType: responseType as "text" | "choice" | "values",
      })
      .onConflictDoUpdate({
        target: [cardResponsesTable.sessionId, cardResponsesTable.cardId],
        set: {
          response,
          responseType: responseType as "text" | "choice" | "values",
          submittedAt: sql`now()`,
        }
      });

    // Update session with completed cards
    const completedResponses = await this.getCardResponses(sessionId);
    const completedCards = completedResponses.map(r => r.cardId);
    
    // Calculate progress based on total available cards
    const [totalCardsResult] = await db.select({ count: count() }).from(gameCardsTable);
    const progress = Math.round((completedCards.length / totalCardsResult.count) * 100);

    const [session] = await db
      .update(gameSessionsTable)
      .set({
        completedCards,
        progress,
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
    if (levelId) {
      return await db
        .select()
        .from(gameCardsTable)
        .where(eq(gameCardsTable.levelId, levelId));
    }
    return await db.select().from(gameCardsTable);
  }

  async getGameLevels(): Promise<GameLevel[]> {
    return await db.select().from(gameLevelsTable);
  }
}

export const storage = new DatabaseStorage();