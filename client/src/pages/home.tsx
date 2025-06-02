import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { QuizStats, GameHistory } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Trophy, TrendingUp, Play, Lightbulb, Landmark, FlaskRound } from "lucide-react";

const categoryConfig = {
  general: {
    name: "일반상식",
    description: "일상생활과 기본 지식",
    icon: Lightbulb,
    gradient: "from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200",
    border: "border-blue-200 hover:border-blue-300",
    iconBg: "bg-blue-500 group-hover:bg-blue-600",
    textColor: "text-blue-600"
  },
  history: {
    name: "역사",
    description: "세계사와 한국사",
    icon: Landmark,
    gradient: "from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200",
    border: "border-emerald-200 hover:border-emerald-300",
    iconBg: "bg-emerald-500 group-hover:bg-emerald-600",
    textColor: "text-emerald-600"
  },
  science: {
    name: "과학",
    description: "물리, 화학, 생물학",
    icon: FlaskRound,
    gradient: "from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200",
    border: "border-amber-200 hover:border-amber-300",
    iconBg: "bg-amber-500 group-hover:bg-amber-600",
    textColor: "text-amber-600"
  }
};

export default function Home() {
  const [, setLocation] = useLocation();

  const { data: stats } = useQuery<QuizStats>({
    queryKey: ["/api/stats"],
  });

  const { data: recentGames } = useQuery<GameHistory[]>({
    queryKey: ["/api/history"],
  });

  const handleCategorySelect = (category: string) => {
    setLocation(`/game/${category}`);
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    const config = categoryConfig[category as keyof typeof categoryConfig];
    if (!config) return Lightbulb;
    return config.icon;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="inline-flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="text-white" size={20} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">퀴즈 챌린지</h1>
              <button
                onClick={() => setLocation('/admin')}
                className="ml-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                title="관리자 모드"
              >
                관리자
              </button>
            </div>
            <p className="text-gray-600 text-lg">지식을 테스트하고 새로운 것을 배워보세요</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Trophy className="text-blue-500" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">최고 점수</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.bestScore || 0}점
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-emerald-500" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">평균 점수</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.averageScore || 0}점
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Play className="text-amber-500" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">총 게임</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalGames || 0}회
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Selection */}
        <Card className="p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">카테고리를 선택하세요</h2>
            <p className="text-gray-600">각 카테고리는 10문제로 구성되어 있습니다</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(categoryConfig).map(([key, config]) => {
              const IconComponent = config.icon;
              return (
                <Button
                  key={key}
                  onClick={() => handleCategorySelect(key)}
                  className={`group relative bg-gradient-to-br ${config.gradient} ${config.border} rounded-xl p-6 border-2 transition-all duration-200 transform hover:scale-105 h-auto`}
                  variant="ghost"
                >
                  <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold opacity-80 group-hover:opacity-100">
                    10
                  </div>
                  <div className="text-center">
                    <div className={`w-16 h-16 ${config.iconBg} rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors`}>
                      <IconComponent className="text-white" size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{config.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{config.description}</p>
                    <span className={`text-sm ${config.textColor} font-medium`}>
                      최고 점수: {stats?.bestScores?.[key as keyof typeof stats.bestScores] || 0}점
                    </span>
                  </div>
                </Button>
              );
            })}
          </div>
        </Card>

        {/* Recent Games */}
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">최근 게임 기록</h3>
          </div>

          <div className="space-y-3">
            {recentGames && recentGames.length > 0 ? (
              recentGames.map((game, index) => {
                const IconComponent = getCategoryIcon(game.category);
                const config = categoryConfig[game.category as keyof typeof categoryConfig];
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 ${config?.iconBg.split(' ')[0] || 'bg-blue-500'} bg-opacity-20 rounded-lg flex items-center justify-center mr-4`}>
                        <IconComponent className={`${config?.textColor || 'text-blue-500'}`} size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {config?.name || game.category}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(game.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">
                        {game.score}/{game.totalQuestions}
                      </p>
                      <p className="text-sm text-gray-500">
                        {game.accuracy}% 정답률
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>아직 게임 기록이 없습니다.</p>
                <p className="text-sm mt-1">첫 퀴즈를 시작해보세요!</p>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
