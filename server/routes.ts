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
  setUserInSession, 
  clearUserFromSession,
  optionalAuth
} from "./auth";
import { z } from "zod";

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
      setUserInSession(req, user);
      
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ 
        message: "Успішний вхід в систему",
        user: userWithoutPassword 
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
      const currentUser = getCurrentUser(req);
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
      const currentUser = getCurrentUser(req);
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
      const currentUser = getCurrentUser(req);
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
      const currentUser = getCurrentUser(req);
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

  // Game sessions with user auth
  app.get("/api/user/game-sessions", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
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

  // Create new game session (requires auth)
  app.post("/api/game-sessions", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
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
      const { cardId, response, responseType = "text" } = req.body;
      
      console.log("Saving response:", { sessionId: id, cardId, response, responseType });
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
      
      const session = await storage.saveCardResponse(id, cardId, response, responseType);
      
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

  // Generate brand map
  app.get("/api/game-sessions/:id/brand-map", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get session first to verify it exists
      const session = await storage.getGameSession(id);
      if (!session) {
        return res.status(404).json({ error: "Game session not found" });
      }
      
      // Get all responses for this session
      const responses = await storage.getSessionCardResponses(id);
      
      // Organize responses by level and card
      const brandMap = {
        session,
        responses: responses || [],
        levels: {
          soul: responses?.filter((r: any) => r.cardId?.startsWith('soul-')) || [],
          mind: responses?.filter((r: any) => r.cardId?.startsWith('mind-')) || [],
          body: responses?.filter((r: any) => r.cardId?.startsWith('body-')) || []
        }
      };
      
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

  const httpServer = createServer(app);
  return httpServer;
}
