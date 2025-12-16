import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertGameSessionSchema, 
  updateGameSessionSchema,
  registerUserSchema,
  loginUserSchema,
  insertUserBrandSchema,
} from "@shared/schema";
import { 
  sessionMiddleware, 
  requireAuth, 
  getCurrentUser, 
  getCurrentUserUnified,
  setUserInSession, 
  clearUserFromSession,
  optionalAuth
} from "./auth";
import { setupOAuthRoutes } from "./oauthProviders";
import { z } from "zod";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { isOpenAIConfigured, generateBrandInsights, analyzeBrandLevel, sendBrandChatMessage } from "./openai";

// Admin middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const user = await storage.getUserById(req.session.user.id);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  req.user = user;
  next();
};

const saveCardResponseSchema = z.object({
  cardId: z.string(),
  response: z.any(),
});

const updateProgressSchema = z.object({
  currentLevel: z.enum(["soul", "mind", "body"]).optional(),
  currentCard: z.string().optional(),
  progress: z.number().min(0).max(100),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply session middleware
  app.use(sessionMiddleware);
  
  // Setup OAuth routes (Google, Apple)
  setupOAuthRoutes(app);

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(validatedData.email);
      
      if (existingUser) {
        return res.status(400).json({ 
          error: "Користувач з такою email адресою вже існує" 
        });
      }

      const user = await storage.createUser({
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        password: validatedData.password,
      });

      setUserInSession(req, user);
      
      const { passwordHash, ...userWithoutPassword } = user;
      res.status(201).json({ 
        message: "Користувач успішно зареєстрований",
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ 
        error: "Помилка реєстрації користувача" 
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginUserSchema.parse(req.body);
      const user = await storage.getUserByEmail(validatedData.email);
      
      if (!user) {
        return res.status(401).json({ 
          error: "Неправильний email або пароль" 
        });
      }

      const isPasswordValid = await storage.verifyPassword(validatedData.password, user.passwordHash);
      
      if (!isPasswordValid) {
        return res.status(401).json({ 
          error: "Неправильний email або пароль" 
        });
      }

      await storage.updateUserLoginTime(user.id);
      
      // Generate simple auth token for iPad compatibility
      const authToken = `auth_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store token in memory/database for validation
      await storage.createAuthToken(user.id, authToken);
      
      // Set user in session as backup
      setUserInSession(req, user);
      
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ 
        message: "Успішний вхід в систему",
        user: userWithoutPassword,
        authToken: authToken  // Send token to client for localStorage
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ 
        error: "Помилка входу в систему" 
      });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    clearUserFromSession(req);
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ error: "Помилка виходу з системи" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Успішний вихід з системи" });
    });
  });

  app.get("/api/logout", (req, res) => {
    clearUserFromSession(req);
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ error: "Помилка виходу з системи" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Успішний вихід з системи" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const user = await storage.getUserById(currentUser.id);
      const profile = await storage.getUserProfile(currentUser.id);
      const settings = await storage.getUserSettings(currentUser.id);

      if (!user) {
        return res.status(404).json({ error: "Користувач не знайдений" });
      }

      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword,
        profile,
        settings
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Помилка отримання даних користувача" });
    }
  });

  // User brands routes
  app.get("/api/user/brands", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const brands = await storage.getUserBrands(currentUser.id);
      res.json(brands);
    } catch (error) {
      console.error("Get user brands error:", error);
      res.status(500).json({ error: "Помилка отримання брендів" });
    }
  });

  app.post("/api/user/brands", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const validatedData = insertUserBrandSchema.parse({
        ...req.body,
        userId: currentUser.id,
      });
      
      const brand = await storage.createUserBrand(validatedData);
      res.status(201).json(brand);
    } catch (error) {
      console.error("Create user brand error:", error);
      res.status(400).json({ error: "Помилка створення бренду" });
    }
  });

  // Delete user brand
  app.delete("/api/user/brands/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      
      // Verify brand belongs to user
      const brand = await storage.getUserBrand(id);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      const deleted = await storage.deleteUserBrand(id);
      if (!deleted) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      res.json({ message: "Бренд успішно видалено" });
    } catch (error) {
      console.error("Delete user brand error:", error);
      res.status(500).json({ error: "Помилка видалення бренду" });
    }
  });

  // Update brand logo
  app.patch("/api/user/brands/:id/logo", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const { logo } = req.body;
      
      // Verify brand belongs to user
      const brand = await storage.getUserBrand(id);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      // Validate logo format (base64 data URL)
      if (logo !== null && logo !== undefined) {
        if (typeof logo !== 'string') {
          return res.status(400).json({ error: "Невірний формат лого" });
        }
        // Allow empty string to remove logo
        if (logo && !logo.startsWith('data:image/')) {
          return res.status(400).json({ error: "Лого має бути у форматі PNG, JPG або SVG" });
        }
        // Check size limit (~2MB in base64)
        if (logo.length > 2800000) {
          return res.status(400).json({ error: "Розмір лого не повинен перевищувати 2MB" });
        }
      }

      const updated = await storage.updateUserBrandLogo(id, logo || null);
      res.json(updated);
    } catch (error) {
      console.error("Update brand logo error:", error);
      res.status(500).json({ error: "Помилка оновлення лого" });
    }
  });

  // Brand AI Analysis routes
  app.get("/api/brands/:brandId/ai-analyses", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      
      const brand = await storage.getUserBrand(brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      const analyses = await storage.getBrandAiAnalyses(brandId);
      res.json(analyses);
    } catch (error) {
      console.error("Get brand AI analyses error:", error);
      res.status(500).json({ error: "Помилка отримання AI аналізу" });
    }
  });

  app.get("/api/brands/:brandId/ai-analyses/latest", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      
      const brand = await storage.getUserBrand(brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      const analysis = await storage.getLatestBrandAiAnalysis(brandId);
      res.json(analysis || null);
    } catch (error) {
      console.error("Get latest brand AI analysis error:", error);
      res.status(500).json({ error: "Помилка отримання AI аналізу" });
    }
  });

  app.post("/api/brands/:brandId/ai-analyses", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      
      const brand = await storage.getUserBrand(brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      const analysis = await storage.createBrandAiAnalysis({
        brandId,
        userId: currentUser.id,
        analysisType: req.body.analysisType || 'full',
        content: req.body.content,
        score: req.body.score,
        insights: req.body.insights,
        recommendations: req.body.recommendations,
        strengths: req.body.strengths,
        weaknesses: req.body.weaknesses,
        provider: req.body.provider,
        model: req.body.model,
        tokensUsed: req.body.tokensUsed,
        generationTimeMs: req.body.generationTimeMs,
      });
      
      res.status(201).json(analysis);
    } catch (error) {
      console.error("Create brand AI analysis error:", error);
      res.status(500).json({ error: "Помилка збереження AI аналізу" });
    }
  });

  // Game sessions with user auth
  app.get("/api/user/game-sessions", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const sessions = await storage.getUserGameSessions(currentUser.id);
      res.json(sessions);
    } catch (error) {
      console.error("Get user game sessions error:", error);
      res.status(500).json({ error: "Помилка отримання ігрових сесій" });
    }
  });

  // User stats
  app.get("/api/user/stats", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const stats = await storage.getUserStats(currentUser.id);
      res.json(stats);
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({ error: "Помилка отримання статистики" });
    }
  });

  // Create new game session (requires auth)
  app.post("/api/game-sessions", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertGameSessionSchema.parse({
        ...req.body,
        userId: currentUser.id,
        currentCard: req.body.currentCard?.toString() || "1",
      });
      
      const session = await storage.createGameSession(validatedData);
      res.json(session);
    } catch (error) {
      console.error("Error creating game session:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Delete game session
  app.delete("/api/game-sessions/:sessionId", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { sessionId } = req.params;
      
      // Verify session belongs to user
      const session = await storage.getGameSession(sessionId);
      if (!session || session.userId !== currentUser.id) {
        return res.status(404).json({ error: "Game session not found" });
      }

      const deleted = await storage.deleteGameSession(sessionId);
      if (!deleted) {
        return res.status(404).json({ error: "Game session not found" });
      }

      res.json({ message: "Game session deleted successfully" });
    } catch (error) {
      console.error("Delete game session error:", error);
      res.status(500).json({ error: "Failed to delete game session" });
    }
  });

  // Get game session
  app.get("/api/game-sessions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getGameSession(id);
      
      if (!session) {
        return res.status(404).json({ error: "Game session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error fetching game session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update game session
  app.patch("/api/game-sessions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateGameSessionSchema.parse(req.body);
      const session = await storage.updateGameSession(id, id, validatedData);
      
      if (!session) {
        return res.status(404).json({ error: "Game session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error updating game session:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Save card response
  app.post("/api/game-sessions/:id/responses", async (req, res) => {
    try {
      const { id } = req.params;
      const { cardId, response, responseType = "text", timeSpent, isWithinTimeLimit, earnedXP } = req.body;
      
      console.log("Saving response:", { sessionId: id, cardId, response, responseType });
      console.log("Timer data:", { timeSpent, isWithinTimeLimit, earnedXP });
      console.log("Response type:", typeof response);
      console.log("Response length:", response?.length);
      
      // Check if required fields are present
      if (!cardId) {
        console.log("Missing cardId");
        return res.status(400).json({ error: "Card ID is required" });
      }
      
      // Allow empty responses for text cards - they can be saved as draft
      if (response === undefined || response === null) {
        console.log("Response is null or undefined:", response);
        return res.status(400).json({ error: "Response is required" });
      }
      
      // Verify card exists before saving response  
      try {
        const cardExists = await storage.getGameCard(cardId);
        if (!cardExists) {
          console.log(`Card ${cardId} does not exist in database`);
          return res.status(400).json({ error: `Card ${cardId} does not exist` });
        }
        console.log(`Card ${cardId} found in database:`, cardExists.title);
      } catch (cardError) {
        console.error("Error checking card existence:", cardError);
        return res.status(400).json({ error: "Error validating card" });
      }
      
      const session = await storage.saveCardResponse(id, cardId, response, responseType, {
        timeSpent,
        isWithinTimeLimit,
        earnedXP
      });
      
      if (!session) {
        return res.status(404).json({ error: "Game session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error saving card response:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Update game progress
  app.post("/api/game-sessions/:id/progress", async (req, res) => {
    try {
      const { id } = req.params;
      const progressData = updateProgressSchema.parse(req.body);
      
      const session = await storage.updateGameSession(id, id, progressData);
      
      if (!session) {
        return res.status(404).json({ error: "Game session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Get game progress
  app.get("/api/game-sessions/:id/progress", async (req, res) => {
    try {
      const { id } = req.params;
      const progress = await storage.getGameProgress(id);
      
      if (!progress) {
        return res.status(404).json({ error: "Game session not found" });
      }
      
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get card option sets for specific card
  app.get('/api/cards/:cardId/option-sets', async (req, res) => {
    try {
      const cardId = req.params.cardId;
      const optionSetIds = await storage.getCardOptionSetsByCardId(cardId);
      
      // Get full option set data
      const optionSets = [];
      for (const setId of optionSetIds) {
        const set = await storage.getCardOptionSet(setId);
        if (set) {
          const options = await storage.getCardOptionsBySetId(setId);
          optionSets.push({ ...set, options });
        }
      }
      
      res.json(optionSets);
    } catch (error) {
      console.error('Error fetching card option sets:', error);
      res.status(500).json({ error: 'Failed to fetch card option sets' });
    }
  });

  // Generate brand map
  app.get("/api/game-sessions/:id/brand-map", async (req, res) => {
    try {
      const { id } = req.params;
      const brandMap = await storage.generateBrandMap(id);
      
      if (!brandMap) {
        return res.status(404).json({ error: "Game session not found" });
      }
      
      res.json(brandMap);
    } catch (error) {
      console.error("Error generating brand map:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Complete game session
  app.post("/api/game-sessions/:id/complete", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if session exists first
      const existingSession = await storage.getGameSession(id);
      if (!existingSession) {
        return res.status(404).json({ error: "Game session not found" });
      }
      
      // Only update if not already completed
      if (!existingSession.completed) {
        const session = await storage.updateGameSession(id, id, {
          completed: new Date(),
          progress: 100,
        });
        
        console.log(`Game session ${id} marked as completed`);
        res.json(session);
      } else {
        console.log(`Game session ${id} already completed`);
        res.json(existingSession);
      }
    } catch (error) {
      console.error("Error completing game session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get game levels
  app.get("/api/game-levels", async (req, res) => {
    try {
      const levels = await storage.getGameLevels();
      res.json(levels);
    } catch (error) {
      console.error("Error fetching game levels:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get game cards (all or by level)
  app.get("/api/game-cards", async (req, res) => {
    try {
      const { level } = req.query;
      const cards = await storage.getGameCards(level as string);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching game cards:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get options for specific card
  app.get("/api/game-cards/:cardId/options", async (req, res) => {
    try {
      const { cardId } = req.params;
      const options = await storage.getCardOptionsByCardId(cardId);
      res.json(options);
    } catch (error) {
      console.error("Error fetching card options:", error);
      res.status(500).json({ error: "Failed to fetch card options" });
    }
  });

  // Get all card options (for admin options list)
  app.get("/api/admin/card-options/all", requireAdmin, async (req, res) => {
    try {
      const allOptions = await storage.getAllCardOptions();
      res.json(allOptions);
    } catch (error) {
      console.error("Error fetching all card options:", error);
      res.status(500).json({ error: "Failed to fetch all card options" });
    }
  });

  // Get card responses for session with card details
  app.get("/api/game-sessions/:id/responses", async (req, res) => {
    try {
      const { id } = req.params;
      const responses = await storage.getSessionCardResponses(id);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching card responses:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // =============================================================================
  // ADMIN ROUTES - Access restricted to admin role only
  // =============================================================================

  // Admin dashboard data
  app.get("/api/admin/dashboard", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all game cards for admin editing
  app.get("/api/admin/cards", requireAdmin, async (req, res) => {
    try {
      const cards = await storage.getAllCardsWithProperties();
      res.json(cards);
    } catch (error) {
      console.error("Error fetching admin cards:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update game card
  app.put("/api/admin/cards/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const cardData = req.body;
      const updatedCard = await storage.updateGameCard(id, cardData);
      res.json(updatedCard);
    } catch (error) {
      console.error("Error updating card:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create new game card
  app.post("/api/admin/cards", requireAdmin, async (req, res) => {
    try {
      const cardData = req.body;
      const newCard = await storage.createGameCard(cardData);
      res.json(newCard);
    } catch (error) {
      console.error("Error creating card:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete game card
  app.delete("/api/admin/cards/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGameCard(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting card:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get card properties
  app.get("/api/admin/cards/:id/properties", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const properties = await storage.getCardProperties(id);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching card properties:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update card properties
  app.put("/api/admin/cards/:id/properties", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const properties = req.body.properties;
      const updatedProperties = await storage.updateCardProperties(id, properties);
      res.json(updatedProperties);
    } catch (error) {
      console.error("Error updating card properties:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all levels for admin editing
  app.get("/api/admin/levels", requireAdmin, async (req, res) => {
    try {
      const levels = await storage.getGameLevels();
      res.json(levels);
    } catch (error) {
      console.error("Error fetching admin levels:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update game level
  app.put("/api/admin/levels/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const levelData = req.body;
      const updatedLevel = await storage.updateGameLevel(id, levelData);
      res.json(updatedLevel);
    } catch (error) {
      console.error("Error updating level:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Reorder cards
  app.post("/api/admin/cards/reorder", requireAdmin, async (req, res) => {
    try {
      console.log("Reorder request body:", req.body);
      const { cards } = req.body;
      console.log("Cards to reorder:", cards);
      
      if (!cards || !Array.isArray(cards)) {
        return res.status(400).json({ error: "Invalid cards data" });
      }
      
      await storage.reorderCards(cards);
      res.json({ success: true, message: "Cards reordered successfully" });
    } catch (error) {
      console.error("Error reordering cards:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Normalize card positions
  app.post("/api/admin/cards/normalize-positions", requireAdmin, async (req, res) => {
    try {
      await storage.normalizeCardPositions();
      res.json({ success: true, message: "Card positions normalized" });
    } catch (error) {
      console.error("Error normalizing positions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin users management
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const userData = req.body;
      const updatedUser = await storage.updateUser(id, userData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Card Option Sets Routes
  app.get("/api/admin/card-option-sets", requireAdmin, async (req, res) => {
    try {
      const cardTypeId = req.query.cardTypeId as string | undefined;
      const optionSets = await storage.getCardOptionSets(cardTypeId);
      res.json(optionSets);
    } catch (error) {
      console.error("Error fetching card option sets:", error);
      res.status(500).json({ error: "Failed to fetch card option sets" });
    }
  });

  // Get options for specific option set
  app.get("/api/admin/card-option-sets/:setId/options", requireAdmin, async (req, res) => {
    try {
      const { setId } = req.params;
      const options = await storage.getCardOptionsBySetId(setId);
      res.json(options);
    } catch (error) {
      console.error("Error fetching card options:", error);
      res.status(500).json({ error: "Failed to fetch card options" });
    }
  });

  app.get("/api/admin/card-option-sets/:id", requireAdmin, async (req, res) => {
    try {
      const optionSet = await storage.getCardOptionSet(req.params.id);
      if (!optionSet) {
        return res.status(404).json({ error: "Card option set not found" });
      }
      res.json(optionSet);
    } catch (error) {
      console.error("Error fetching card option set:", error);
      res.status(500).json({ error: "Failed to fetch card option set" });
    }
  });

  app.post("/api/admin/card-option-sets", requireAdmin, async (req, res) => {
    try {
      const optionSet = await storage.createCardOptionSet(req.body);
      res.json(optionSet);
    } catch (error) {
      console.error("Error creating card option set:", error);
      res.status(500).json({ error: "Failed to create card option set" });
    }
  });

  app.put("/api/admin/card-option-sets/:id", requireAdmin, async (req, res) => {
    try {
      const optionSet = await storage.updateCardOptionSet(req.params.id, req.body);
      if (!optionSet) {
        return res.status(404).json({ error: "Card option set not found" });
      }
      res.json(optionSet);
    } catch (error) {
      console.error("Error updating card option set:", error);
      res.status(500).json({ error: "Failed to update card option set" });
    }
  });

  app.delete("/api/admin/card-option-sets/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteCardOptionSet(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Card option set not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting card option set:", error);
      res.status(500).json({ error: "Failed to delete card option set" });
    }
  });

  // Card Options Routes
  app.get("/api/admin/card-options/:optionSetId", requireAdmin, async (req, res) => {
    try {
      const options = await storage.getCardOptions(req.params.optionSetId);
      res.json(options);
    } catch (error) {
      console.error("Error fetching card options:", error);
      res.status(500).json({ error: "Failed to fetch card options" });
    }
  });

  app.post("/api/admin/card-options", requireAdmin, async (req, res) => {
    try {
      const option = await storage.createCardOption(req.body);
      res.json(option);
    } catch (error) {
      console.error("Error creating card option:", error);
      res.status(500).json({ error: "Failed to create card option" });
    }
  });

  app.put("/api/admin/card-options/:id", requireAdmin, async (req, res) => {
    try {
      const option = await storage.updateCardOption(req.params.id, req.body);
      if (!option) {
        return res.status(404).json({ error: "Card option not found" });
      }
      res.json(option);
    } catch (error) {
      console.error("Error updating card option:", error);
      res.status(500).json({ error: "Failed to update card option" });
    }
  });

  app.delete("/api/admin/card-options/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteCardOption(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Card option not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting card option:", error);
      res.status(500).json({ error: "Failed to delete card option" });
    }
  });

  // =====================================================
  // DATABASE SYNC ROUTES (Dev to Production)
  // =====================================================

  // Get comparison between dev and prod databases
  app.get("/api/admin/db-sync/compare", requireAdmin, async (req, res) => {
    try {
      const devDbUrl = process.env.DEVELOPMENT_DATABASE_URL;
      const prodDbUrl = process.env.PRODUCTION_DATABASE_URL;
      
      if (!devDbUrl || !prodDbUrl) {
        return res.status(400).json({ 
          error: "Database URLs not configured",
          devConfigured: !!devDbUrl,
          prodConfigured: !!prodDbUrl
        });
      }

      // Import neon for both databases
      const { neon } = await import("@neondatabase/serverless");
      const devQuery = neon(devDbUrl);
      const prodQuery = neon(prodDbUrl);

      // Tables to sync
      const tables = [
        'game_levels',
        'game_cards', 
        'card_properties',
        'card_relations',
        'card_option_sets',
        'card_options',
        'card_option_set_links',
        'users',
        'user_profiles',
        'user_settings',
        'user_brands',
        'game_sessions',
        'card_responses'
      ];

      const comparison: any[] = [];

      for (const table of tables) {
        try {
          // Get dev count
          let devCount = 0;
          try {
            const devResult = await devQuery(`SELECT COUNT(*) as count FROM "${table}"`);
            devCount = Number(devResult[0]?.count || 0);
          } catch (e: any) {
            if (e.message?.includes('does not exist')) {
              devCount = -1;
            }
          }

          // Get prod count
          let prodCount = 0;
          try {
            const prodResult = await prodQuery(`SELECT COUNT(*) as count FROM "${table}"`);
            prodCount = Number(prodResult[0]?.count || 0);
          } catch (e: any) {
            if (e.message?.includes('does not exist')) {
              prodCount = -1; // Table doesn't exist in prod
            }
          }

          comparison.push({
            table,
            devCount: devCount >= 0 ? devCount : 0,
            prodCount: prodCount >= 0 ? prodCount : 0,
            diff: (devCount >= 0 ? devCount : 0) - (prodCount >= 0 ? prodCount : 0),
            status: prodCount === -1 ? 'missing' : (devCount === prodCount ? 'synced' : 'different')
          });
        } catch (e: any) {
          comparison.push({
            table,
            devCount: 0,
            prodCount: 0,
            diff: 0,
            status: 'error',
            error: e.message
          });
        }
      }

      res.json({ comparison, devDbConnected: true, prodDbConnected: true });
    } catch (error: any) {
      console.error("DB Sync compare error:", error);
      res.status(500).json({ error: error.message || "Failed to compare databases" });
    }
  });

  // Sync a specific table from dev to prod
  app.post("/api/admin/db-sync/sync-table", requireAdmin, async (req, res) => {
    try {
      const { table } = req.body;
      if (!table) {
        return res.status(400).json({ error: "Table name required" });
      }

      const devDbUrl = process.env.DEVELOPMENT_DATABASE_URL;
      const prodDbUrl = process.env.PRODUCTION_DATABASE_URL;
      if (!devDbUrl || !prodDbUrl) {
        return res.status(400).json({ error: "Database URLs not configured" });
      }

      const { neon } = await import("@neondatabase/serverless");
      const devQuery = neon(devDbUrl);
      const prodQuery = neon(prodDbUrl);

      // Get all data from dev
      const devData = await devQuery(`SELECT * FROM "${table}"`);
      
      if (devData.length === 0) {
        return res.json({ synced: 0, message: "No data to sync" });
      }

      // Truncate prod table first
      await prodQuery(`TRUNCATE TABLE "${table}" CASCADE`);

      // Build INSERT statements  
      const columns = Object.keys(devData[0]);
      let synced = 0;

      // Get column types for proper JSON handling
      const columnTypesResult = await devQuery(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
      `);
      const jsonColumns = new Set(
        columnTypesResult
          .filter((r: any) => r.data_type === 'json' || r.data_type === 'jsonb')
          .map((r: any) => r.column_name)
      );

      for (const row of devData) {
        const values = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          
          // Handle JSON columns FIRST - always stringify any value
          if (jsonColumns.has(col)) {
            const jsonStr = JSON.stringify(val).replace(/'/g, "''");
            return `'${jsonStr}'::json`;
          }
          
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'number') return String(val);
          if (typeof val === 'object') {
            const jsonStr = JSON.stringify(val).replace(/'/g, "''");
            return `'${jsonStr}'`;
          }
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        const columnsStr = columns.map(c => `"${c}"`).join(', ');
        const valuesStr = values.join(', ');
        
        await prodQuery(`INSERT INTO "${table}" (${columnsStr}) VALUES (${valuesStr})`);
        synced++;
      }

      res.json({ synced, message: `Successfully synced ${synced} rows` });
    } catch (error: any) {
      console.error("DB Sync table error:", error);
      res.status(500).json({ error: error.message || "Failed to sync table" });
    }
  });

  // Sync all tables
  app.post("/api/admin/db-sync/sync-all", requireAdmin, async (req, res) => {
    try {
      const devDbUrl = process.env.DEVELOPMENT_DATABASE_URL;
      const prodDbUrl = process.env.PRODUCTION_DATABASE_URL;
      if (!devDbUrl || !prodDbUrl) {
        return res.status(400).json({ error: "Database URLs not configured" });
      }

      const { neon } = await import("@neondatabase/serverless");
      const devQuery = neon(devDbUrl);
      const prodQuery = neon(prodDbUrl);

      // Tables in order (respecting foreign keys)
      const tables = [
        'game_levels',
        'users',
        'user_profiles',
        'user_settings',
        'user_brands',
        'game_cards',
        'card_properties',
        'card_relations',
        'card_option_sets',
        'card_options',
        'card_option_set_links',
        'game_sessions',
        'card_responses'
      ];

      const results: any[] = [];

      // First truncate all tables in reverse order
      for (const table of [...tables].reverse()) {
        try {
          await prodQuery(`TRUNCATE TABLE "${table}" CASCADE`);
        } catch (e) {
          // Ignore if table doesn't exist
        }
      }

      // Now insert data
      for (const table of tables) {
        try {
          const devData = await devQuery(`SELECT * FROM "${table}"`);
          
          if (devData.length === 0) {
            results.push({ table, synced: 0, status: 'empty' });
            continue;
          }

          const columns = Object.keys(devData[0]);
          let synced = 0;

          // Get column types for proper JSON handling
          const columnTypesResult = await devQuery(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '${table}'
          `);
          const jsonColumns = new Set(
            columnTypesResult
              .filter((r: any) => r.data_type === 'json' || r.data_type === 'jsonb')
              .map((r: any) => r.column_name)
          );

          for (const row of devData) {
            const values = columns.map(col => {
              const val = row[col];
              if (val === null || val === undefined) return 'NULL';
              
              // Handle JSON columns FIRST - always stringify any value
              if (jsonColumns.has(col)) {
                const jsonStr = JSON.stringify(val).replace(/'/g, "''");
                return `'${jsonStr}'::json`;
              }
              
              if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
              if (val instanceof Date) return `'${val.toISOString()}'`;
              if (typeof val === 'number') return String(val);
              if (typeof val === 'object') {
                const jsonStr = JSON.stringify(val).replace(/'/g, "''");
                return `'${jsonStr}'`;
              }
              return `'${String(val).replace(/'/g, "''")}'`;
            });
            const columnsStr = columns.map(c => `"${c}"`).join(', ');
            const valuesStr = values.join(', ');
            
            await prodQuery(`INSERT INTO "${table}" (${columnsStr}) VALUES (${valuesStr})`);
            synced++;
          }

          results.push({ table, synced, status: 'success' });
        } catch (e: any) {
          results.push({ table, synced: 0, status: 'error', error: e.message });
        }
      }

      res.json({ results, success: true });
    } catch (error: any) {
      console.error("DB Sync all error:", error);
      res.status(500).json({ error: error.message || "Failed to sync all tables" });
    }
  });

  // ============= AI/OpenAI Settings & Analysis =============

  // Check AI providers settings (OpenAI and Perplexity)
  app.get("/api/admin/ai-settings", requireAdmin, async (req, res) => {
    try {
      const configured = await isOpenAIConfigured();
      const openaiDbSetting = await storage.getAppSetting("OPENAI_API_KEY");
      const perplexityDbSetting = await storage.getAppSetting("PERPLEXITY_API_KEY");
      
      // Get AI configuration settings
      const aiProvider = await storage.getAppSetting("AI_PROVIDER");
      const aiModelOpenAI = await storage.getAppSetting("AI_MODEL_OPENAI");
      const aiModelPerplexity = await storage.getAppSetting("AI_MODEL_PERPLEXITY");
      const aiContext = await storage.getAppSetting("AI_CONTEXT");
      
      res.json({
        openai: {
          configured: !!openaiDbSetting?.value || !!process.env.OPENAI_API_KEY,
          hasDbKey: !!openaiDbSetting?.value,
          hasEnvKey: !!process.env.OPENAI_API_KEY,
          keySource: openaiDbSetting?.value ? 'database' : (process.env.OPENAI_API_KEY ? 'environment' : 'none')
        },
        perplexity: {
          configured: !!perplexityDbSetting?.value || !!process.env.PERPLEXITY_API_KEY,
          hasDbKey: !!perplexityDbSetting?.value,
          hasEnvKey: !!process.env.PERPLEXITY_API_KEY,
          keySource: perplexityDbSetting?.value ? 'database' : (process.env.PERPLEXITY_API_KEY ? 'environment' : 'none')
        },
        settings: {
          provider: aiProvider?.value || 'openai',
          modelOpenAI: aiModelOpenAI?.value || 'gpt-4o',
          modelPerplexity: aiModelPerplexity?.value || 'sonar-pro',
          context: aiContext?.value || ''
        },
        configured
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Save AI API key to database (OpenAI or Perplexity)
  app.post("/api/admin/ai-settings", requireAdmin, async (req, res) => {
    try {
      const { apiKey, provider = 'openai' } = req.body;
      
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
        return res.status(400).json({ error: "Некоректний API ключ" });
      }

      const keyName = provider === 'perplexity' ? 'PERPLEXITY_API_KEY' : 'OPENAI_API_KEY';
      const description = provider === 'perplexity' 
        ? 'Perplexity API ключ для AI аналізу брендів'
        : 'OpenAI API ключ для AI аналізу брендів';

      await storage.setAppSetting(keyName, apiKey.trim(), true, description);

      if (provider === 'openai') {
        const { resetOpenAIClient } = await import("./openai");
        resetOpenAIClient();
      }

      res.json({ 
        success: true, 
        message: `${provider === 'perplexity' ? 'Perplexity' : 'OpenAI'} API ключ успішно збережено` 
      });
    } catch (error: any) {
      console.error("Error saving API key:", error);
      res.status(500).json({ error: "Не вдалося зберегти API ключ" });
    }
  });

  // Save AI configuration settings
  app.post("/api/admin/ai-settings/config", requireAdmin, async (req, res) => {
    try {
      const { provider, modelOpenAI, modelPerplexity, context } = req.body;

      if (provider) {
        await storage.setAppSetting("AI_PROVIDER", provider, false, "Активний AI провайдер (openai/perplexity)");
      }
      if (modelOpenAI) {
        await storage.setAppSetting("AI_MODEL_OPENAI", modelOpenAI, false, "Модель OpenAI для використання");
      }
      if (modelPerplexity) {
        await storage.setAppSetting("AI_MODEL_PERPLEXITY", modelPerplexity, false, "Модель Perplexity для використання");
      }
      if (context !== undefined) {
        await storage.setAppSetting("AI_CONTEXT", context, false, "Додатковий контекст для AI промптів");
      }

      res.json({ success: true, message: "Налаштування успішно збережено" });
    } catch (error: any) {
      console.error("Error saving AI config:", error);
      res.status(500).json({ error: "Не вдалося зберегти налаштування" });
    }
  });

  // Get AI usage statistics
  app.get("/api/admin/ai-usage", requireAdmin, async (req, res) => {
    try {
      const period = (req.query.period as 'day' | 'week' | 'month' | 'all') || 'all';
      const stats = await storage.getAIUsageStats(period);
      const recentLogs = await storage.getAIUsageLogs(20);
      
      res.json({
        stats,
        recentLogs
      });
    } catch (error: any) {
      console.error("Error fetching AI usage:", error);
      res.status(500).json({ error: "Не вдалося отримати статистику AI" });
    }
  });

  // Get NanoBanana usage statistics
  app.get("/api/admin/nanobanana-usage", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getNanoBananaUsageStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching NanoBanana usage:", error);
      res.status(500).json({ error: "Не вдалося отримати статистику NanoBanana" });
    }
  });

  // Generate AI insights for a game session
  app.post("/api/game-sessions/:sessionId/ai-insights", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const isConfigured = await isOpenAIConfigured();
      if (!isConfigured) {
        return res.status(400).json({ error: "AI API не налаштовано. Зверніться до адміністратора." });
      }

      const { sessionId } = req.params;
      const startTime = Date.now();
      
      // Get game session to find brand info
      const gameSession = await storage.getGameSession(sessionId);
      if (!gameSession) {
        return res.status(404).json({ error: "Гру не знайдено" });
      }
      
      // Get brand data if available
      let brandData: { name: string; description?: string } | undefined;
      if (gameSession.brandId) {
        const brand = await storage.getUserBrand(gameSession.brandId);
        if (brand) {
          brandData = { 
            name: brand.name, 
            description: brand.description || undefined 
          };
        }
      }
      
      const responses = await storage.getSessionCardResponses(sessionId);
      
      if (!responses || responses.length === 0) {
        return res.status(400).json({ error: "Немає відповідей для аналізу" });
      }

      // Format responses with full structure (use cardDescription as question)
      const formattedResponses = responses.map(r => ({
        level: r.level,
        cardTitle: r.cardTitle,
        question: r.cardDescription || undefined,
        response: r.response
      }));

      console.log("AI Analysis Request:", {
        sessionId,
        brandName: brandData?.name,
        responsesCount: formattedResponses.length,
        levels: Array.from(new Set(formattedResponses.map(r => r.level)))
      });

      const insights = await generateBrandInsights(formattedResponses, brandData);
      const generationTimeMs = Date.now() - startTime;

      // Save analysis to database if brand exists
      if (gameSession.brandId) {
        try {
          // Extract key metrics for storage
          const levelStrengths: string[] = [];
          const levelWeaknesses: string[] = [];
          const levelRecommendations: string[] = [];
          
          if (insights.levels) {
            insights.levels.forEach((level: any) => {
              if (level.strengths) levelStrengths.push(...level.strengths);
              if (level.weaknesses) levelWeaknesses.push(...level.weaknesses);
              if (level.recommendations) levelRecommendations.push(...level.recommendations);
            });
          }

          await storage.createBrandAiAnalysis({
            brandId: gameSession.brandId,
            userId: currentUser.id,
            analysisType: 'full',
            content: insights,
            score: insights.overallScore || null,
            insights: insights.nextSteps || null,
            recommendations: levelRecommendations.length > 0 ? levelRecommendations : null,
            strengths: levelStrengths.length > 0 ? levelStrengths : null,
            weaknesses: levelWeaknesses.length > 0 ? levelWeaknesses : null,
            provider: 'openai',
            model: 'gpt-4o',
            tokensUsed: null,
            generationTimeMs,
          });
          console.log("AI Analysis saved to database for brand:", gameSession.brandId);
        } catch (saveError) {
          console.error("Failed to save AI analysis to database:", saveError);
          // Continue - we still want to return the insights even if saving failed
        }
      }

      res.json(insights);
    } catch (error: any) {
      console.error("AI Insights error:", error);
      res.status(500).json({ error: error.message || "Помилка генерації AI-аналізу" });
    }
  });

  // Generate AI insights for a specific level
  app.post("/api/game-sessions/:sessionId/ai-insights/:level", requireAuth, async (req, res) => {
    try {
      const isConfigured = await isOpenAIConfigured();
      if (!isConfigured) {
        return res.status(400).json({ error: "AI API не налаштовано" });
      }

      const { sessionId, level } = req.params;
      if (!["soul", "mind", "body"].includes(level)) {
        return res.status(400).json({ error: "Невірний рівень" });
      }

      // Get game session to find brand info
      const gameSession = await storage.getGameSession(sessionId);
      let brandData: { name: string; description?: string } | undefined;
      if (gameSession?.brandId) {
        const brand = await storage.getUserBrand(gameSession.brandId);
        if (brand) {
          brandData = { name: brand.name, description: brand.description || undefined };
        }
      }

      const responses = await storage.getSessionCardResponses(sessionId);
      const levelResponses = responses.filter(r => r.level === level);
      
      if (levelResponses.length === 0) {
        return res.status(400).json({ error: "Немає відповідей для цього рівня" });
      }

      const insight = await analyzeBrandLevel(
        level as "soul" | "mind" | "body",
        levelResponses.map(r => ({ cardTitle: r.cardTitle, question: r.cardDescription, response: r.response })),
        brandData
      );
      res.json(insight);
    } catch (error: any) {
      console.error("Level AI Insights error:", error);
      res.status(500).json({ error: error.message || "Помилка аналізу рівня" });
    }
  });

  // AI Chat - Get chat history for a game session
  app.get("/api/game-sessions/:sessionId/chat", requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.session?.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const gameSession = await storage.getGameSession(sessionId);
      if (!gameSession) {
        return res.status(404).json({ error: "Гру не знайдено" });
      }

      if (gameSession.userId !== userId) {
        return res.status(403).json({ error: "Немає доступу до цієї гри" });
      }

      const messages = await storage.getAiChatMessages(sessionId);
      res.json(messages);
    } catch (error: any) {
      console.error("Get chat history error:", error);
      res.status(500).json({ error: "Не вдалося отримати історію чату" });
    }
  });

  // AI Chat - Send message
  app.post("/api/game-sessions/:sessionId/chat", requireAuth, async (req, res) => {
    try {
      const isConfigured = await isOpenAIConfigured();
      if (!isConfigured) {
        return res.status(400).json({ error: "AI API не налаштовано. Зверніться до адміністратора." });
      }

      const { sessionId } = req.params;
      const { message } = req.body;
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Повідомлення обов'язкове" });
      }

      const gameSession = await storage.getGameSession(sessionId);
      if (!gameSession) {
        return res.status(404).json({ error: "Гру не знайдено" });
      }

      if (gameSession.userId !== userId) {
        return res.status(403).json({ error: "Немає доступу до цієї гри" });
      }

      // Get brand info
      let brandName = "Бренд";
      let brandDescription: string | undefined;
      if (gameSession.brandId) {
        const brand = await storage.getUserBrand(gameSession.brandId);
        if (brand) {
          brandName = brand.name;
          brandDescription = brand.description || undefined;
        }
      }

      // Get card responses for context
      const responses = await storage.getSessionCardResponses(sessionId);
      const formattedResponses = responses.map(r => ({
        level: r.level,
        cardTitle: r.cardTitle,
        question: r.cardDescription || undefined,
        response: r.response
      }));

      // Get chat history (filter out image messages - OpenAI doesn't support role='image')
      const existingMessages = await storage.getAiChatMessages(sessionId);
      const chatHistory = existingMessages
        .filter(m => m.role !== 'image')
        .map(m => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content
        }));

      // Save user message
      await storage.addAiChatMessage({
        sessionId,
        userId,
        role: "user",
        content: message
      });

      // Get AI response
      const aiResponse = await sendBrandChatMessage(
        message,
        chatHistory,
        {
          brandName,
          brandDescription,
          responses: formattedResponses
        },
        sessionId
      );

      // Save AI response
      const savedMessage = await storage.addAiChatMessage({
        sessionId,
        userId,
        role: "assistant",
        content: aiResponse.response,
        metadata: aiResponse.tokensUsed ? { tokens: aiResponse.tokensUsed } : null
      });

      res.json({
        message: savedMessage,
        tokensUsed: aiResponse.tokensUsed
      });
    } catch (error: any) {
      console.error("AI Chat error:", error);
      res.status(500).json({ error: error.message || "Помилка AI чату" });
    }
  });

  // AI Chat - Delete chat history
  app.delete("/api/game-sessions/:sessionId/chat", requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const gameSession = await storage.getGameSession(sessionId);
      if (!gameSession) {
        return res.status(404).json({ error: "Гру не знайдено" });
      }

      if (gameSession.userId !== userId) {
        return res.status(403).json({ error: "Немає доступу до цієї гри" });
      }

      await storage.deleteAiChatMessages(sessionId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete chat error:", error);
      res.status(500).json({ error: "Не вдалося видалити історію чату" });
    }
  });

  // User Settings API
  app.get("/api/user/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const profile = await storage.getUserProfile(userId);
      
      res.json({
        hasGeminiApiKey: !!profile?.geminiApiKey,
        maskedApiKey: profile?.geminiApiKey ? 
          (await import('./encryption')).maskApiKey(
            (await import('./encryption')).decryptApiKey(profile.geminiApiKey) || ''
          ) : undefined
      });
    } catch (error: any) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Не вдалося отримати налаштування" });
    }
  });

  app.post("/api/user/settings/gemini-api-key", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== 'string') {
        return res.status(400).json({ error: "API ключ обов'язковий" });
      }

      const { encryptApiKey } = await import('./encryption');
      const encryptedKey = encryptApiKey(apiKey);

      let profile = await storage.getUserProfile(userId);
      if (!profile) {
        profile = await storage.createUserProfile({ userId, geminiApiKey: encryptedKey } as any);
      } else {
        profile = await storage.updateUserProfile(userId, { geminiApiKey: encryptedKey });
      }

      res.json({ success: true, message: "API ключ збережено" });
    } catch (error: any) {
      console.error("Save API key error:", error);
      res.status(500).json({ error: "Не вдалося зберегти API ключ" });
    }
  });

  app.delete("/api/user/settings/gemini-api-key", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      await storage.updateUserProfile(userId, { geminiApiKey: null });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete API key error:", error);
      res.status(500).json({ error: "Не вдалося видалити API ключ" });
    }
  });

  // NanoBanana Image Generation
  app.post("/api/game-sessions/:sessionId/generate-image", requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { prompt, aspectRatio = '1:1' } = req.body;
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "Опис зображення обов'язковий" });
      }

      const gameSession = await storage.getGameSession(sessionId);
      if (!gameSession) {
        return res.status(404).json({ error: "Гру не знайдено" });
      }

      if (gameSession.userId !== userId) {
        return res.status(403).json({ error: "Немає доступу до цієї гри" });
      }

      const profile = await storage.getUserProfile(userId);
      if (!profile?.geminiApiKey) {
        return res.status(400).json({ 
          error: "API ключ не налаштовано. Додайте NanoBanana API ключ у налаштуваннях." 
        });
      }

      // Get brand context
      let brandContext = '';
      if (gameSession.brandId) {
        const brand = await storage.getUserBrand(gameSession.brandId);
        if (brand) {
          brandContext = `Brand: ${brand.name}. ${brand.description || ''}`;
        }
      }

      const { generateImageWithNanoBanana } = await import('./nanobanana');
      const result = await generateImageWithNanoBanana(profile.geminiApiKey, prompt, brandContext, aspectRatio, sessionId, userId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Save image message to database
      const imageUrl = result.imageUrl || result.imageBase64;
      if (imageUrl) {
        await storage.saveChatMessage(sessionId, userId, 'image', prompt, imageUrl);
      }

      res.json({ 
        success: true, 
        imageBase64: result.imageBase64,
        imageUrl: result.imageUrl
      });
    } catch (error: any) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: "Не вдалося згенерувати зображення" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
