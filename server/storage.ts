import { type GameSession, type InsertGameSession, type UpdateGameSession, type BrandMap } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Game session CRUD operations
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getGameSession(id: string): Promise<GameSession | undefined>;
  updateGameSession(id: string, updates: UpdateGameSession): Promise<GameSession | undefined>;
  deleteGameSession(id: string): Promise<boolean>;
  
  // Game progress operations
  saveCardResponse(sessionId: string, cardId: string, responses: Record<string, any>): Promise<GameSession | undefined>;
  getGameProgress(sessionId: string): Promise<{ progress: number; currentLevel: string; currentCard: number } | undefined>;
  generateBrandMap(sessionId: string): Promise<BrandMap | undefined>;
}

export class MemStorage implements IStorage {
  private gameSessions: Map<string, GameSession>;

  constructor() {
    this.gameSessions = new Map();
  }

  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
    const id = randomUUID();
    const now = new Date();
    const session: GameSession = {
      id,
      userId: insertSession.userId || null,
      currentLevel: insertSession.currentLevel || "soul",
      currentCard: insertSession.currentCard || 1,
      responses: insertSession.responses || {},
      progress: insertSession.progress || 0,
      completed: insertSession.completed || null,
      createdAt: now,
      updatedAt: now,
    };
    this.gameSessions.set(id, session);
    return session;
  }

  async getGameSession(id: string): Promise<GameSession | undefined> {
    return this.gameSessions.get(id);
  }

  async updateGameSession(id: string, updates: UpdateGameSession): Promise<GameSession | undefined> {
    const session = this.gameSessions.get(id);
    if (!session) return undefined;

    const updatedSession: GameSession = {
      ...session,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.gameSessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteGameSession(id: string): Promise<boolean> {
    return this.gameSessions.delete(id);
  }

  async saveCardResponse(sessionId: string, cardId: string, responses: Record<string, any>): Promise<GameSession | undefined> {
    const session = this.gameSessions.get(sessionId);
    if (!session) return undefined;

    const currentResponses = session.responses as Record<string, any> || {};
    const updatedResponses = {
      ...currentResponses,
      [cardId]: {
        ...responses,
        timestamp: new Date().toISOString(),
      }
    };

    return this.updateGameSession(sessionId, {
      responses: updatedResponses,
    });
  }

  async getGameProgress(sessionId: string): Promise<{ progress: number; currentLevel: string; currentCard: number } | undefined> {
    const session = this.gameSessions.get(sessionId);
    if (!session) return undefined;

    return {
      progress: session.progress,
      currentLevel: session.currentLevel,
      currentCard: session.currentCard,
    };
  }

  async generateBrandMap(sessionId: string): Promise<BrandMap | undefined> {
    const session = this.gameSessions.get(sessionId);
    if (!session) return undefined;

    const responses = session.responses as Record<string, any> || {};
    
    // Extract responses and build brand map
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

    // Process soul responses
    Object.entries(responses).forEach(([cardId, response]) => {
      if (cardId.startsWith('soul-')) {
        if (cardId === 'soul-values' && response.selectedValues) {
          brandMap.soul.values = response.selectedValues;
        } else if (cardId === 'soul-mission' && response.mission) {
          brandMap.soul.mission = response.mission;
        } else if (cardId === 'soul-story' && response.story) {
          brandMap.soul.story = response.story;
        } else if (cardId === 'soul-purpose' && response.purpose) {
          brandMap.soul.purpose = response.purpose;
        }
      } else if (cardId.startsWith('mind-')) {
        if (cardId === 'mind-audience' && response.audience) {
          brandMap.mind.targetAudience = response.audience;
        } else if (cardId === 'mind-idea' && response.idea) {
          brandMap.mind.brandIdea = response.idea;
        } else if (cardId === 'mind-promise' && response.promise) {
          brandMap.mind.promise = response.promise;
        } else if (cardId === 'mind-archetype' && response.archetype) {
          brandMap.mind.archetype = response.archetype;
        } else if (cardId === 'mind-positioning' && response.positioning) {
          brandMap.mind.positioning = response.positioning;
        } else if (cardId === 'mind-unique-value' && response.uniqueValue) {
          brandMap.mind.uniqueValue = response.uniqueValue;
        }
      } else if (cardId.startsWith('body-')) {
        if (cardId === 'body-products' && response.products) {
          brandMap.body.products = Array.isArray(response.products) ? response.products : [response.products];
        } else if (cardId === 'body-channels' && response.channels) {
          brandMap.body.channels = Array.isArray(response.channels) ? response.channels : [response.channels];
        } else if (cardId === 'body-visual-style' && response.visualStyle) {
          brandMap.body.visualStyle = response.visualStyle;
        } else if (cardId === 'body-tone' && response.toneOfVoice) {
          brandMap.body.toneOfVoice = response.toneOfVoice;
        } else if (cardId === 'body-actions' && response.actions) {
          brandMap.body.actions = Array.isArray(response.actions) ? response.actions : [response.actions];
        } else if (cardId === 'body-resources' && response.resources) {
          brandMap.body.resources = response.resources;
        }
      }
    });

    return brandMap;
  }
}

export const storage = new MemStorage();
