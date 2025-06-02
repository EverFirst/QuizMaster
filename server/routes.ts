import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameHistorySchema, insertGameAnswerSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get quiz questions by category
  app.get("/api/quiz/:category", async (req, res) => {
    try {
      const { category } = req.params;
      
      if (!['general', 'history', 'science'].includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }

      const questions = await storage.getQuestionsByCategory(category);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Get quiz statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getQuizStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Get game history
  app.get("/api/history", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const history = await storage.getGameHistory(limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ error: "Failed to fetch game history" });
    }
  });

  // Save game result
  app.post("/api/game/complete", async (req, res) => {
    try {
      const gameDataSchema = z.object({
        game: insertGameHistorySchema,
        answers: z.array(insertGameAnswerSchema)
      });

      const { game, answers } = gameDataSchema.parse(req.body);

      const savedGame = await storage.saveGameHistory(game);
      
      if (answers.length > 0) {
        const answersWithGameId = answers.map(answer => ({
          ...answer,
          gameId: savedGame.id
        }));
        await storage.saveGameAnswers(answersWithGameId);
      }

      res.json({ success: true, gameId: savedGame.id });
    } catch (error) {
      console.error("Error saving game:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid game data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to save game result" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
