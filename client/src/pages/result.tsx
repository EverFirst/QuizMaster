import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Target, Clock, TrendingUp, RotateCcw, Home, Share, X } from "lucide-react";

type GameResult = {
  category: string;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  accuracy: number;
  answers: Array<{
    questionId: number;
    selectedAnswer?: number;
    userAnswer?: string;
    isCorrect: boolean;
  }>;
  questions: Array<{
    id: number;
    question: string;
    type?: string;
    options?: string[];
    correctAnswer?: number;
    correctAnswers?: string[];
  }>;
};

export default function Result() {
  const [, setLocation] = useLocation();
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  useEffect(() => {
    const storedResult = sessionStorage.getItem('lastGameResult');
    if (storedResult) {
      setGameResult(JSON.parse(storedResult));
    } else {
      // No result found, redirect to home
      setLocation('/');
    }
  }, [setLocation]);

  const handlePlayAgain = () => {
    if (gameResult) {
      const categoryMap: { [key: string]: string } = {
        "일반상식": "general",
        "역사": "history",
        "과학": "science"
      };
      const categoryKey = categoryMap[gameResult.category];
      if (categoryKey) {
        setLocation(`/game/${categoryKey}`);
      }
    }
  };

  const handleGoHome = () => {
    setLocation('/');
  };

  const handleShareResult = () => {
    const text = `퀴즈 챌린지 결과: ${gameResult?.category} ${gameResult?.score}/${gameResult?.totalQuestions}점 (${gameResult?.accuracy}% 정답률)`;
    
    if (navigator.share) {
      navigator.share({
        title: '퀴즈 챌린지 결과',
        text: text,
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('결과가 클립보드에 복사되었습니다!');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}분 ${remainingSeconds}초`;
  };

  const getPerformanceBadge = (accuracy: number) => {
    if (accuracy >= 90) return { text: "완벽한 성과입니다! 🏆", color: "text-yellow-600" };
    if (accuracy >= 80) return { text: "우수한 성과입니다! ⭐", color: "text-blue-600" };
    if (accuracy >= 70) return { text: "좋은 성과입니다! 👍", color: "text-green-600" };
    return { text: "좋은 시도였습니다!", color: "text-gray-600" };
  };

  if (!gameResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const badge = getPerformanceBadge(gameResult.accuracy);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Result Header */}
      <header className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-4">
            <Trophy size={48} />
          </div>
          <h1 className="text-3xl font-bold mb-2">퀴즈 완료!</h1>
          <p className="text-blue-100 text-lg">수고하셨습니다. 결과를 확인해보세요.</p>
        </div>
      </header>

      {/* Result Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Score Card */}
        <Card className="p-8 mb-8 text-center shadow-lg">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4 animate-pulse">
              <span className="text-white text-3xl font-bold">{gameResult.score}</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {gameResult.score}점 / {gameResult.totalQuestions}점
            </h2>
            <p className="text-xl text-gray-600">
              정답률: <span className="font-semibold text-blue-600">{gameResult.accuracy}%</span>
            </p>
          </div>

          {/* Performance Badge */}
          <div className={`inline-flex items-center px-6 py-3 bg-emerald-100 ${badge.color} rounded-full font-semibold`}>
            <Trophy className="mr-2" size={16} />
            {badge.text}
          </div>
        </Card>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="text-blue-500" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">정답 수</h3>
              <p className="text-3xl font-bold text-blue-600">{gameResult.score}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="text-amber-500" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">소요 시간</h3>
              <p className="text-3xl font-bold text-amber-600">{formatTime(gameResult.timeSpent)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-emerald-500" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">카테고리</h3>
              <p className="text-3xl font-bold text-emerald-600">{gameResult.category}</p>
            </CardContent>
          </Card>
        </div>

        {/* Question Review */}
        <Card className="p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">문제별 결과</h3>
          
          <div className="space-y-4">
            {gameResult.questions.map((question, index) => {
              const answer = gameResult.answers[index];
              const isCorrect = answer?.isCorrect;
              
              return (
                <div key={question.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 ${isCorrect ? 'bg-emerald-100' : 'bg-red-100'} rounded-lg flex items-center justify-center mr-4`}>
                      {isCorrect ? (
                        <Trophy className="text-emerald-600" size={16} />
                      ) : (
                        <X className="text-red-600" size={16} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Q{index + 1}. {question.question}
                      </p>
                      <p className="text-sm text-gray-600">
                        {question.type === 'fill_blank' ? (
                          <>
                            정답: {question.correctAnswers?.join(', ') || '정답 없음'}
                            {!isCorrect && answer && answer.userAnswer && (
                              <span className="text-red-600">
                                {" "}(입력: {answer.userAnswer})
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            정답: {question.options?.[question.correctAnswer || 0] || '정답 없음'}
                            {!isCorrect && answer && answer.selectedAnswer !== undefined && (
                              <span className="text-red-600">
                                {" "}(선택: {question.options?.[answer.selectedAnswer] || '선택 없음'})
                              </span>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className={`font-semibold ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isCorrect ? '정답' : '오답'}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handlePlayAgain}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors transform hover:scale-105"
          >
            <RotateCcw className="mr-2" size={16} />
            다시 도전하기
          </Button>
          
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="px-8 py-3 rounded-xl font-semibold transition-colors"
          >
            <Home className="mr-2" size={16} />
            홈으로 돌아가기
          </Button>

          <Button
            onClick={handleShareResult}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors transform hover:scale-105"
          >
            <Share className="mr-2" size={16} />
            결과 공유하기
          </Button>
        </div>
      </main>
    </div>
  );
}
