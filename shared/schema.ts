import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  question: text("question").notNull(),
  type: text("type").notNull().default("multiple_choice"), // 'multiple_choice' or 'fill_blank'
  options: text("options").array(), // nullable for fill_blank questions
  correctAnswer: integer("correct_answer"), // nullable for fill_blank questions
  correctAnswers: text("correct_answers").array(), // for fill_blank questions
  hints: text("hints").array(), // hints for fill_blank questions
});

export const gameHistory = pgTable("game_history", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  timeSpent: integer("time_spent").notNull(), // in seconds
  accuracy: integer("accuracy").notNull(), // percentage
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameAnswers = pgTable("game_answers", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  questionId: integer("question_id").notNull(),
  selectedAnswer: integer("selected_answer"), // nullable for fill_blank questions
  userAnswer: text("user_answer"), // for fill_blank questions
  isCorrect: integer("is_correct").notNull(), // 0 or 1 as boolean
  partialScore: integer("partial_score"), // for partial points in fill_blank
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
});

export const insertGameHistorySchema = createInsertSchema(gameHistory).omit({
  id: true,
  createdAt: true,
});

export const insertGameAnswerSchema = createInsertSchema(gameAnswers).omit({
  id: true,
});

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type GameHistory = typeof gameHistory.$inferSelect;
export type InsertGameHistory = z.infer<typeof insertGameHistorySchema>;
export type GameAnswer = typeof gameAnswers.$inferSelect;
export type InsertGameAnswer = z.infer<typeof insertGameAnswerSchema>;

// Game state types
export type GameState = {
  category: string;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  score: number;
  answers: {
    questionId: number;
    selectedAnswer?: number;
    userAnswer?: string;
    isCorrect: boolean;
  }[];
  startTime: number;
};

export type QuizStats = {
  bestScore: number;
  averageScore: number;
  totalGames: number;
  bestScores: {
    general: number;
    history: number;
    science: number;
  };
};
