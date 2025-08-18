import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameSessionSchema, updateGameSessionSchema } from "@shared/schema";
import { z } from "zod";

const saveCardResponseSchema = z.object({
  cardId: z.string(),
  responses: z.record(z.any()),
});

const updateProgressSchema = z.object({
  currentLevel: z.enum(["soul", "mind", "body"]),
  currentCard: z.number(),
  progress: z.number().min(0).max(100),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create new game session
  app.post("/api/game-sessions", async (req, res) => {
    try {
      const validatedData = insertGameSessionSchema.parse(req.body);
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
      const session = await storage.updateGameSession(id, validatedData);
      
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
      const { cardId, responses } = saveCardResponseSchema.parse(req.body);
      
      const session = await storage.saveCardResponse(id, cardId, responses);
      
      if (!session) {
        return res.status(404).json({ error: "Game session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error saving card response:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Update game progress
  app.post("/api/game-sessions/:id/progress", async (req, res) => {
    try {
      const { id } = req.params;
      const progressData = updateProgressSchema.parse(req.body);
      
      const session = await storage.updateGameSession(id, progressData);
      
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
      const session = await storage.updateGameSession(id, {
        completed: new Date(),
        progress: 100,
      });
      
      if (!session) {
        return res.status(404).json({ error: "Game session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error completing game session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
