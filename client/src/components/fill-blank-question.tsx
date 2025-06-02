import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Check, X, ArrowRight } from "lucide-react";

interface FillBlankQuestionProps {
  question: {
    id: number;
    question: string;
    correctAnswers: string[];
    hints?: string[];
  };
  onAnswer: (answer: string, isCorrect: boolean, score: number) => void;
  timeLeft: number;
}

export function FillBlankQuestion({ question, onAnswer, timeLeft }: FillBlankQuestionProps) {
  const [userAnswer, setUserAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [feedback, setFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    score: number;
    message: string;
  } | null>(null);

  // 답안 유사도 계산 함수 (간단한 Levenshtein Distance)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[j][i] = matrix[j - 1][i - 1];
        } else {
          matrix[j][i] = Math.min(
            matrix[j - 1][i] + 1,
            matrix[j][i - 1] + 1,
            matrix[j - 1][i - 1] + 1
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
  };

  // 답안 검증 함수
  const validateAnswer = (answer: string) => {
    const normalized = answer.trim().toLowerCase();
    
    if (!normalized) return null;

    // 1. 정확한 일치 검사
    for (const correctAnswer of question.correctAnswers) {
      if (normalized === correctAnswer.toLowerCase()) {
        return { correct: true, score: 100, message: "정답입니다!" };
      }
    }

    // 2. 유사도 기반 검사
    let maxSimilarity = 0;
    for (const correctAnswer of question.correctAnswers) {
      const similarity = calculateSimilarity(normalized, correctAnswer.toLowerCase());
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    if (maxSimilarity > 0.8) {
      return { correct: true, score: 80, message: "정답입니다! (유사한 답안)" };
    } else if (maxSimilarity > 0.6) {
      return { correct: false, score: 50, message: "아쉽습니다. 힌트를 참고해보세요!" };
    }

    return { correct: false, score: 0, message: "오답입니다. 다시 시도해보세요!" };
  };

  const handleSubmit = () => {
    const result = validateAnswer(userAnswer);
    if (result) {
      setFeedback({
        show: true,
        isCorrect: result.correct,
        score: result.score,
        message: result.message
      });

      setTimeout(() => {
        onAnswer(userAnswer, result.correct, result.score);
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer.trim()) {
      handleSubmit();
    }
  };

  const showNextHint = () => {
    if (question.hints && currentHintIndex < question.hints.length) {
      setShowHint(true);
      setCurrentHintIndex(currentHintIndex + 1);
    }
  };

  // 문제 텍스트에서 빈칸 위치 찾기 및 렌더링
  const renderQuestion = () => {
    const parts = question.question.split('______');
    if (parts.length === 2) {
      return (
        <div className="text-lg font-medium text-center">
          <span>{parts[0]}</span>
          <Input
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            className="inline-block w-32 mx-2 text-center border-2 border-dashed border-blue-400"
            placeholder="답안 입력"
            disabled={feedback?.show}
          />
          <span>{parts[1]}</span>
        </div>
      );
    }
    return <div className="text-lg font-medium text-center">{question.question}</div>;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-8">
        <div className="space-y-6">
          {/* 시간 표시 */}
          <div className="flex justify-between items-center">
            <Badge variant="secondary">빈칸채우기</Badge>
            <Badge 
              variant={timeLeft <= 10 ? "destructive" : timeLeft <= 20 ? "default" : "secondary"}
              className="text-lg px-3 py-1"
            >
              {timeLeft}초
            </Badge>
          </div>

          {/* 문제 */}
          <div className="bg-blue-50 p-6 rounded-lg">
            {renderQuestion()}
          </div>

          {/* 힌트 섹션 */}
          {question.hints && question.hints.length > 0 && (
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={showNextHint}
                disabled={currentHintIndex >= question.hints.length || feedback?.show}
                className="w-full"
              >
                <Lightbulb className="mr-2" size={16} />
                힌트 보기 ({currentHintIndex}/{question.hints.length})
              </Button>

              {showHint && currentHintIndex > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="text-yellow-600 mt-1" size={16} />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">힌트</p>
                      <p className="text-yellow-700">{question.hints[currentHintIndex - 1]}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 답안 제출 버튼 */}
          {!feedback?.show && (
            <Button
              onClick={handleSubmit}
              disabled={!userAnswer.trim()}
              className="w-full"
              size="lg"
            >
              답안 제출
              <ArrowRight className="ml-2" size={16} />
            </Button>
          )}

          {/* 피드백 */}
          {feedback?.show && (
            <div className={`p-4 rounded-lg border-2 ${
              feedback.isCorrect 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {feedback.isCorrect ? (
                  <Check className="text-green-600" size={20} />
                ) : (
                  <X className="text-red-600" size={20} />
                )}
                <div>
                  <p className={`font-medium ${
                    feedback.isCorrect ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {feedback.message}
                  </p>
                  <p className="text-sm text-gray-600">
                    획득 점수: {feedback.score}점
                  </p>
                  {!feedback.isCorrect && (
                    <p className="text-sm text-gray-600 mt-1">
                      정답: {question.correctAnswers.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}