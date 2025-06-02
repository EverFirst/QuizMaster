import { useState } from "react";
import { GameState } from "@shared/schema";

export function useQuiz() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const startGame = (category: string, questions: any[]) => {
    setGameState({
      category,
      questions: questions.slice(0, 10), // Take only 10 questions
      currentQuestionIndex: 0,
      score: 0,
      answers: [],
      startTime: Date.now(),
    });
  };

  const answerQuestion = (questionId: number, selectedAnswer: number, isCorrect: boolean) => {
    if (!gameState) return;

    const newAnswer = {
      questionId,
      selectedAnswer,
      isCorrect,
    };

    setGameState(prev => prev ? {
      ...prev,
      score: isCorrect ? prev.score + 1 : prev.score,
      answers: [...prev.answers, newAnswer]
    } : null);
  };

  const nextQuestion = () => {
    if (!gameState) return false;

    if (gameState.currentQuestionIndex + 1 >= gameState.questions.length) {
      return true; // Game complete
    }

    setGameState(prev => prev ? {
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex + 1
    } : null);

    return false;
  };

  const resetGame = () => {
    setGameState(null);
  };

  return {
    gameState,
    startGame,
    answerQuestion,
    nextQuestion,
    resetGame,
  };
}
