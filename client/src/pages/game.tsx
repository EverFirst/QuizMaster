import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { QuizQuestion, GameState } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, X, Clock } from "lucide-react";
import { LoadingOverlay } from "@/components/loading-overlay";
import { FillBlankQuestion } from "@/components/fill-blank-question";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const categoryNames = {
  general: "일반상식",
  history: "역사", 
  science: "과학"
};

export default function Game() {
  const { category } = useParams<{ category: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30초 제한시간
  const [timerActive, setTimerActive] = useState(false);

  const { data: questions, isLoading } = useQuery<QuizQuestion[]>({
    queryKey: [`/api/quiz/${category}`],
    enabled: !!category && ["general", "history", "science"].includes(category),
  });

  const saveGameMutation = useMutation({
    mutationFn: async (gameData: { game: any; answers: any[] }) => {
      return apiRequest("POST", "/api/game/complete", gameData);
    },
    onSuccess: () => {
      setLocation("/result");
    },
    onError: (error) => {
      console.error("Failed to save game:", error);
      toast({
        title: "게임 저장 실패",
        description: "게임 결과를 저장하는데 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (questions && questions.length > 0 && !gameState) {
      // Take only 10 questions
      const gameQuestions = questions.slice(0, 10);
      
      setGameState({
        category: category!,
        questions: gameQuestions,
        currentQuestionIndex: 0,
        score: 0,
        answers: [],
        startTime: Date.now(),
      });
      
      setTimeLeft(30);
      setTimerActive(true);
    }
  }, [questions, category, gameState]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerActive && timeLeft > 0 && !isAnswered) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up - auto-submit wrong answer
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, isAnswered]);

  const handleTimeUp = () => {
    if (!gameState || isAnswered) return;
    
    // Auto-select wrong answer when time runs out
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    const wrongAnswer = currentQuestion.correctAnswer === 0 ? 1 : 0;
    
    setSelectedAnswer(wrongAnswer);
    setIsAnswered(true);
    setShowFeedback(true);
    setTimerActive(false);

    const newAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: wrongAnswer,
      isCorrect: false,
    };

    setGameState(prev => prev ? {
      ...prev,
      answers: [...prev.answers, newAnswer]
    } : null);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered || !gameState) return;

    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    setShowFeedback(true);
    setTimerActive(false);

    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;

    const newAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: answerIndex,
      isCorrect,
    };

    setGameState(prev => prev ? {
      ...prev,
      score: isCorrect ? prev.score + 1 : prev.score,
      answers: [...prev.answers, newAnswer]
    } : null);
  };

  const handleNextQuestion = () => {
    if (!gameState) return;

    if (gameState.currentQuestionIndex + 1 >= gameState.questions.length) {
      // Game complete
      const endTime = Date.now();
      const timeSpent = Math.floor((endTime - gameState.startTime) / 1000);
      const accuracy = Math.round((gameState.score / gameState.questions.length) * 100);

      const gameData = {
        game: {
          category: categoryNames[category as keyof typeof categoryNames],
          score: gameState.score,
          totalQuestions: gameState.questions.length,
          timeSpent,
          accuracy,
        },
        answers: gameState.answers.map(answer => ({
          gameId: 0, // Will be set by backend
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer,
          isCorrect: answer.isCorrect ? 1 : 0,
        })),
      };

      // Store game state for result page
      sessionStorage.setItem('lastGameResult', JSON.stringify({
        ...gameData.game,
        answers: gameState.answers,
        questions: gameState.questions,
      }));

      saveGameMutation.mutate(gameData);
    } else {
      // Next question
      setGameState(prev => prev ? {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      } : null);
      
      setSelectedAnswer(null);
      setShowFeedback(false);
      setIsAnswered(false);
      setTimeLeft(30);
      setTimerActive(true);
    }
  };

  const handleExitGame = () => {
    setLocation("/");
  };

  if (isLoading || !gameState) {
    return <LoadingOverlay message="문제를 불러오는 중..." />;
  }

  if (!category || !["general", "history", "science"].includes(category)) {
    setLocation("/");
    return null;
  }

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  const progress = ((gameState.currentQuestionIndex + 1) / gameState.questions.length) * 100;
  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Game Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleExitGame}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="mr-2" size={16} />
              <span className="hidden sm:inline">나가기</span>
            </Button>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {categoryNames[category as keyof typeof categoryNames]}
              </h2>
              <p className="text-sm text-gray-500">
                {gameState.currentQuestionIndex + 1} / {gameState.questions.length}
              </p>
            </div>

            <div className="text-right">
              <div className="flex items-center space-x-4">
                {/* Timer Display */}
                <div className="text-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 ${
                    timeLeft <= 10 
                      ? 'border-red-400 bg-red-50 animate-pulse' 
                      : timeLeft <= 20 
                        ? 'border-amber-400 bg-amber-50' 
                        : 'border-blue-400 bg-blue-50'
                  }`}>
                    <span className={`text-lg font-bold ${
                      timeLeft <= 10 
                        ? 'text-red-600' 
                        : timeLeft <= 20 
                          ? 'text-amber-600' 
                          : 'text-blue-600'
                    }`}>
                      {timeLeft}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">초</p>
                </div>
                
                {/* Score Display */}
                <div>
                  <p className="text-sm text-gray-500">점수</p>
                  <p className="text-lg font-bold text-blue-600">{gameState.score}점</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      {/* Game Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8">
          {/* Question */}
          <div className="mb-8">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                <span className="text-blue-600 font-bold text-sm">
                  Q{gameState.currentQuestionIndex + 1}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
                  {currentQuestion.question}
                </h3>
              </div>
            </div>
          </div>

          {/* Answer Section - conditional rendering based on question type */}
          {currentQuestion.type === 'fill_blank' ? (
            <FillBlankQuestion
              question={{
                id: currentQuestion.id,
                question: currentQuestion.question,
                correctAnswers: currentQuestion.correctAnswers || [],
                hints: currentQuestion.hints || []
              }}
              onAnswer={(answer, isCorrect, score) => {
                setUserAnswer(answer);
                setIsAnswered(true);
                setShowFeedback(true);
                setTimerActive(false);
                
                const updatedGameState = {
                  ...gameState,
                  score: gameState.score + (isCorrect ? score : 0),
                  answers: [
                    ...gameState.answers,
                    {
                      questionId: currentQuestion.id,
                      selectedAnswer: -1, // Not applicable for fill_blank
                      isCorrect
                    }
                  ]
                };
                setGameState(updatedGameState);
              }}
              timeLeft={timeLeft}
            />
          ) : (
            <div className="space-y-4 mb-8">
              {currentQuestion.options?.map((option, index) => {
                let buttonClass = "w-full text-left p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group";
                
                if (isAnswered) {
                  if (index === currentQuestion.correctAnswer) {
                    buttonClass = "w-full text-left p-4 border-2 border-emerald-400 bg-emerald-50 rounded-xl";
                  } else if (index === selectedAnswer && index !== currentQuestion.correctAnswer) {
                    buttonClass = "w-full text-left p-4 border-2 border-red-400 bg-red-50 rounded-xl";
                  } else {
                    buttonClass = "w-full text-left p-4 border-2 border-gray-200 rounded-xl opacity-50";
                  }
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={isAnswered}
                    className={buttonClass}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center mr-4 group-hover:border-blue-400 transition-colors">
                        <span className="text-gray-600 font-medium group-hover:text-blue-600">
                          {optionLabels[index]}
                        </span>
                      </div>
                      <span className="text-gray-900 font-medium group-hover:text-gray-700">
                        {option}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Feedback Section */}
          {showFeedback && (
            <div className="mb-8">
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-r-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="text-emerald-600" size={16} />
                    </div>
                    <div>
                      <p className="text-emerald-800 font-semibold">정답입니다!</p>
                      <p className="text-emerald-700 text-sm mt-1">잘하셨습니다. 다음 문제로 넘어가세요.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <X className="text-red-600" size={16} />
                    </div>
                    <div>
                      <p className="text-red-800 font-semibold">
                        {timeLeft === 0 ? "시간 종료!" : "틀렸습니다"}
                      </p>
                      <p className="text-red-700 text-sm mt-1">
                        정답은 <strong>{currentQuestion.options[currentQuestion.correctAnswer]}</strong>입니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleNextQuestion}
                className="mt-4 w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors transform hover:scale-105"
                disabled={saveGameMutation.isPending}
              >
                {gameState.currentQuestionIndex + 1 >= gameState.questions.length ? "결과 보기" : "다음 문제"}
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
