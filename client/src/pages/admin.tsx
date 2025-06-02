import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { QuizQuestion, InsertQuizQuestion } from "@shared/schema";
import { Lock, Plus, List, Home, Eye, EyeOff } from "lucide-react";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"add" | "list">("add");
  
  // Form state for adding questions
  const [newQuestion, setNewQuestion] = useState<InsertQuizQuestion>({
    category: "general",
    type: "multiple_choice",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    correctAnswers: [],
    hints: []
  });

  const ADMIN_PASSWORD = "admin123"; // 간단한 패스워드

  const { data: questions } = useQuery<QuizQuestion[]>({
    queryKey: ["/api/quiz/all"],
    enabled: isAuthenticated,
  });

  const generateQuestionMutation = useMutation({
    mutationFn: async (category: string) => {
      const response = await apiRequest("POST", "/api/admin/generate-question", { category });
      return response.json();
    },
    onSuccess: (generatedQuestion: any) => {
      setNewQuestion({
        category: newQuestion.category,
        question: generatedQuestion.question,
        options: generatedQuestion.options,
        correctAnswer: generatedQuestion.correctAnswer
      });
      toast({
        title: "문제 생성 완료",
        description: "AI가 새로운 문제를 생성했습니다. 검토 후 저장해주세요.",
      });
    },
    onError: (error) => {
      console.error("Failed to generate question:", error);
      toast({
        title: "문제 생성 실패",
        description: "AI 문제 생성에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const addQuestionMutation = useMutation({
    mutationFn: async (question: InsertQuizQuestion) => {
      return apiRequest("POST", "/api/admin/questions", question);
    },
    onSuccess: () => {
      toast({
        title: "문제 추가 완료",
        description: "새로운 문제가 성공적으로 추가되었습니다.",
      });
      
      // Reset form
      setNewQuestion({
        category: "general",
        type: "multiple_choice",
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        correctAnswers: [],
        hints: []
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/quiz/all"] });
    },
    onError: (error) => {
      console.error("Failed to add question:", error);
      toast({
        title: "문제 추가 실패",
        description: "문제를 추가하는데 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({
        title: "로그인 성공",
        description: "관리자 모드에 접속했습니다.",
      });
    } else {
      toast({
        title: "로그인 실패",
        description: "비밀번호가 올바르지 않습니다.",
        variant: "destructive",
      });
    }
    setPassword("");
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!newQuestion.question.trim()) {
      toast({
        title: "입력 오류",
        description: "문제를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    if (newQuestion.options.some(option => !option.trim())) {
      toast({
        title: "입력 오류", 
        description: "모든 선택지를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    addQuestionMutation.mutate(newQuestion);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const categoryOptions = [
    { value: "general", label: "일반상식" },
    { value: "history", label: "역사" },
    { value: "science", label: "과학" }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-blue-600" size={32} />
            </div>
            <CardTitle className="text-2xl">관리자 로그인</CardTitle>
            <p className="text-gray-600">문제 관리를 위해 로그인하세요</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="관리자 비밀번호를 입력하세요"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button type="submit" className="flex-1">
                  로그인
                </Button>
                <Button type="button" variant="outline" onClick={() => setLocation("/")}>
                  <Home size={16} className="mr-2" />
                  홈으로
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">관리자 패널</h1>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setLocation("/")}>
                <Home size={16} className="mr-2" />
                홈으로
              </Button>
              <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("add")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "add"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Plus size={16} className="inline mr-2" />
            문제 추가
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "list"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <List size={16} className="inline mr-2" />
            문제 목록
          </button>
        </div>

        {activeTab === "add" && (
          <Card>
            <CardHeader>
              <CardTitle>새 문제 추가</CardTitle>
              <p className="text-gray-600">퀴즈에 새로운 문제를 추가합니다</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddQuestion} className="space-y-6">
                {/* Category Selection */}
                <div>
                  <Label htmlFor="category">카테고리</Label>
                  <Select
                    value={newQuestion.category}
                    onValueChange={(value) => setNewQuestion(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Question Type Selection */}
                <div>
                  <Label htmlFor="type">문제 유형</Label>
                  <Select
                    value={newQuestion.type}
                    onValueChange={(value) => {
                      const newType = value as "multiple_choice" | "fill_blank";
                      setNewQuestion(prev => ({
                        ...prev,
                        type: newType,
                        // Reset form fields when type changes
                        options: newType === "multiple_choice" ? ["", "", "", ""] : [],
                        correctAnswer: newType === "multiple_choice" ? 0 : undefined,
                        correctAnswers: newType === "fill_blank" ? [] : [],
                        hints: newType === "fill_blank" ? [] : []
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">객관식 (4지선다)</SelectItem>
                      <SelectItem value="fill_blank">빈칸채우기</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* AI Generate Button */}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => generateQuestionMutation.mutate(newQuestion.category)}
                    disabled={generateQuestionMutation.isPending}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 hover:from-purple-600 hover:to-blue-600"
                  >
                    {generateQuestionMutation.isPending ? "AI 생성 중..." : "🤖 AI로 문제 생성"}
                  </Button>
                </div>

                {/* Question Input */}
                <div>
                  <Label htmlFor="question">문제</Label>
                  <Textarea
                    id="question"
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                    placeholder={
                      newQuestion.type === "fill_blank" 
                        ? "빈칸 위치에 ______ 를 사용하세요. 예: 대한민국의 수도는 ______이다."
                        : "문제를 입력하거나 위의 AI 생성 버튼을 클릭하세요"
                    }
                    rows={3}
                    required
                  />
                  {newQuestion.type === "fill_blank" && (
                    <p className="text-sm text-blue-600 mt-1">
                      💡 빈칸 위치에 반드시 ______ (언더바 6개)를 사용해주세요
                    </p>
                  )}
                </div>

                {/* Conditional Fields based on Question Type */}
                {newQuestion.type === "multiple_choice" ? (
                  <div>
                    <Label>선택지</Label>
                    <div className="space-y-3 mt-2">
                      {newQuestion.options?.map((option, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="correctAnswer"
                              checked={newQuestion.correctAnswer === index}
                              onChange={() => setNewQuestion(prev => ({ ...prev, correctAnswer: index }))}
                              className="mr-2"
                            />
                            <span className="font-medium text-gray-700">
                              {String.fromCharCode(65 + index)}
                            </span>
                          </div>
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`선택지 ${String.fromCharCode(65 + index)}`}
                            required
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      정답에 해당하는 선택지의 라디오 버튼을 선택하세요
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Fill Blank - Correct Answers */}
                    <div>
                      <Label>정답 입력 (여러 개 가능)</Label>
                      <div className="space-y-2 mt-2">
                        {newQuestion.correctAnswers?.map((answer, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={answer}
                              onChange={(e) => {
                                const newAnswers = [...(newQuestion.correctAnswers || [])];
                                newAnswers[index] = e.target.value;
                                setNewQuestion(prev => ({ ...prev, correctAnswers: newAnswers }));
                              }}
                              placeholder={`정답 ${index + 1}`}
                              required={index === 0}
                            />
                            {index > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newAnswers = newQuestion.correctAnswers?.filter((_, i) => i !== index);
                                  setNewQuestion(prev => ({ ...prev, correctAnswers: newAnswers }));
                                }}
                              >
                                삭제
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newAnswers = [...(newQuestion.correctAnswers || []), ""];
                            setNewQuestion(prev => ({ ...prev, correctAnswers: newAnswers }));
                          }}
                        >
                          + 정답 추가
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        동의어나 다른 표현도 정답으로 인정됩니다
                      </p>
                    </div>

                    {/* Fill Blank - Hints */}
                    <div>
                      <Label>힌트 (선택사항)</Label>
                      <div className="space-y-2 mt-2">
                        {newQuestion.hints?.map((hint, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={hint}
                              onChange={(e) => {
                                const newHints = [...(newQuestion.hints || [])];
                                newHints[index] = e.target.value;
                                setNewQuestion(prev => ({ ...prev, hints: newHints }));
                              }}
                              placeholder={`힌트 ${index + 1}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newHints = newQuestion.hints?.filter((_, i) => i !== index);
                                setNewQuestion(prev => ({ ...prev, hints: newHints }));
                              }}
                            >
                              삭제
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newHints = [...(newQuestion.hints || []), ""];
                            setNewQuestion(prev => ({ ...prev, hints: newHints }));
                          }}
                        >
                          + 힌트 추가
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={addQuestionMutation.isPending}
                >
                  {addQuestionMutation.isPending ? "추가 중..." : "문제 추가"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === "list" && (
          <Card>
            <CardHeader>
              <CardTitle>등록된 문제 목록</CardTitle>
              <p className="text-gray-600">현재 등록된 모든 문제를 확인할 수 있습니다</p>
            </CardHeader>
            <CardContent>
              {questions && questions.length > 0 ? (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                            {categoryOptions.find(cat => cat.value === question.category)?.label}
                          </span>
                          <span className="text-gray-500 text-sm">ID: {question.id}</span>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Q{index + 1}. {question.question}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {question.options.map((option, optIndex) => (
                          <div 
                            key={optIndex} 
                            className={`p-2 rounded border ${
                              optIndex === question.correctAnswer 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <span className="font-medium mr-2">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            {option}
                            {optIndex === question.correctAnswer && (
                              <span className="ml-2 text-emerald-600 text-sm">✓ 정답</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>등록된 문제가 없습니다.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}