import { 
  QuizQuestion, 
  InsertQuizQuestion,
  GameHistory,
  InsertGameHistory,
  GameAnswer,
  InsertGameAnswer,
  QuizStats,
  quizQuestions,
  gameHistory,
  gameAnswers
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Quiz questions
  getQuestionsByCategory(category: string): Promise<QuizQuestion[]>;
  getAllQuestions(): Promise<QuizQuestion[]>;
  
  // Game history
  saveGameHistory(game: InsertGameHistory): Promise<GameHistory>;
  getGameHistory(limit?: number): Promise<GameHistory[]>;
  getBestScore(category?: string): Promise<number>;
  
  // Game answers
  saveGameAnswers(answers: InsertGameAnswer[]): Promise<void>;
  
  // Stats
  getQuizStats(): Promise<QuizStats>;
}

export class DatabaseStorage implements IStorage {
  async getQuestionsByCategory(category: string): Promise<QuizQuestion[]> {
    const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.category, category));
    
    // Shuffle questions
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    
    return questions;
  }

  async getAllQuestions(): Promise<QuizQuestion[]> {
    return await db.select().from(quizQuestions);
  }

  async saveGameHistory(game: InsertGameHistory): Promise<GameHistory> {
    const [savedGame] = await db
      .insert(gameHistory)
      .values(game)
      .returning();
    return savedGame;
  }

  async getGameHistory(limit: number = 5): Promise<GameHistory[]> {
    return await db
      .select()
      .from(gameHistory)
      .orderBy(desc(gameHistory.createdAt))
      .limit(limit);
  }

  async getBestScore(category?: string): Promise<number> {
    if (category) {
      const games = await db
        .select()
        .from(gameHistory)
        .where(eq(gameHistory.category, category));
      
      return games.length > 0 
        ? Math.max(...games.map(g => g.score)) 
        : 0;
    }
    
    const games = await db.select().from(gameHistory);
    return games.length > 0 
      ? Math.max(...games.map(g => g.score)) 
      : 0;
  }

  async saveGameAnswers(answers: InsertGameAnswer[]): Promise<void> {
    if (answers.length > 0) {
      await db.insert(gameAnswers).values(answers);
    }
  }

  async getQuizStats(): Promise<QuizStats> {
    const games = await db.select().from(gameHistory);
    
    if (games.length === 0) {
      return {
        bestScore: 0,
        averageScore: 0,
        totalGames: 0,
        bestScores: {
          general: 0,
          history: 0,
          science: 0
        }
      };
    }

    const bestScore = Math.max(...games.map(g => g.score));
    const averageScore = Math.round(
      games.reduce((sum, g) => sum + g.score, 0) / games.length
    );

    const bestScores = {
      general: await this.getBestScore('일반상식'),
      history: await this.getBestScore('역사'),
      science: await this.getBestScore('과학')
    };

    return {
      bestScore,
      averageScore,
      totalGames: games.length,
      bestScores
    };
  }
}

export class MemStorage implements IStorage {
  private questions: Map<number, QuizQuestion>;
  private history: Map<number, GameHistory>;
  private answers: Map<number, GameAnswer>;
  private currentQuestionId: number;
  private currentHistoryId: number;
  private currentAnswerId: number;

  constructor() {
    this.questions = new Map();
    this.history = new Map();
    this.answers = new Map();
    this.currentQuestionId = 1;
    this.currentHistoryId = 1;
    this.currentAnswerId = 1;
    
    // Initialize with quiz data
    this.initializeQuizData();
  }

  private initializeQuizData() {
    const quizData = [
      // 일반상식
      { category: "general", question: "대한민국의 수도는?", options: ["서울", "부산", "대구", "인천"], correctAnswer: 0 },
      { category: "general", question: "가장 높은 산은?", options: ["백두산", "에베레스트산", "후지산", "킬리만자로"], correctAnswer: 1 },
      { category: "general", question: "태양계에서 가장 큰 행성은?", options: ["지구", "목성", "토성", "화성"], correctAnswer: 1 },
      { category: "general", question: "한국의 통화는?", options: ["엔", "달러", "원", "위안"], correctAnswer: 2 },
      { category: "general", question: "세계에서 가장 긴 강은?", options: ["아마존강", "나일강", "양쯔강", "미시시피강"], correctAnswer: 1 },
      { category: "general", question: "올림픽이 처음 개최된 나라는?", options: ["이탈리아", "프랑스", "그리스", "영국"], correctAnswer: 2 },
      { category: "general", question: "컴퓨터의 뇌 역할을 하는 부품은?", options: ["RAM", "CPU", "GPU", "SSD"], correctAnswer: 1 },
      { category: "general", question: "인간의 뼈는 몇 개인가?", options: ["206개", "198개", "215개", "224개"], correctAnswer: 0 },
      { category: "general", question: "지구의 자전 주기는?", options: ["12시간", "24시간", "48시간", "72시간"], correctAnswer: 1 },
      { category: "general", question: "한글을 창제한 왕은?", options: ["세종대왕", "태종", "정조", "영조"], correctAnswer: 0 },
      
      // 역사
      { category: "history", question: "조선왕조는 몇 년간 지속되었나?", options: ["392년", "418년", "456년", "518년"], correctAnswer: 3 },
      { category: "history", question: "제2차 세계대전이 끝난 해는?", options: ["1944년", "1945년", "1946년", "1947년"], correctAnswer: 1 },
      { category: "history", question: "고구려를 건국한 인물은?", options: ["온조", "주몽", "박혁거세", "김수로"], correctAnswer: 1 },
      { category: "history", question: "프랑스 혁명이 일어난 해는?", options: ["1789년", "1799년", "1804년", "1815년"], correctAnswer: 0 },
      { category: "history", question: "한국 전쟁이 발발한 해는?", options: ["1948년", "1949년", "1950년", "1951년"], correctAnswer: 2 },
      { category: "history", question: "이집트 피라미드가 있는 도시는?", options: ["카이로", "기자", "룩소르", "알렉산드리아"], correctAnswer: 1 },
      { category: "history", question: "몽골 제국을 건설한 인물은?", options: ["쿠빌라이 칸", "칭기즈 칸", "바투 칸", "오고타이 칸"], correctAnswer: 1 },
      { category: "history", question: "로마 제국이 동서로 분할된 해는?", options: ["365년", "395년", "476년", "527년"], correctAnswer: 1 },
      { category: "history", question: "임진왜란이 시작된 해는?", options: ["1590년", "1592년", "1594년", "1596년"], correctAnswer: 1 },
      { category: "history", question: "미국 독립선언서가 발표된 해는?", options: ["1774년", "1775년", "1776년", "1777년"], correctAnswer: 2 },
      
      // 과학
      { category: "science", question: "물의 화학식은?", options: ["H2O", "CO2", "NaCl", "CH4"], correctAnswer: 0 },
      { category: "science", question: "빛의 속도는 약 얼마인가?", options: ["30만km/s", "25만km/s", "35만km/s", "40만km/s"], correctAnswer: 0 },
      { category: "science", question: "인체에서 가장 큰 장기는?", options: ["심장", "폐", "간", "피부"], correctAnswer: 3 },
      { category: "science", question: "원자의 중심에 있는 것은?", options: ["전자", "양성자", "중성자", "원자핵"], correctAnswer: 3 },
      { category: "science", question: "DNA의 이중나선 구조를 발견한 과학자는?", options: ["다윈", "멘델", "왓슨과 크릭", "파스퇴르"], correctAnswer: 2 },
      { category: "science", question: "지구의 대기 중 가장 많은 기체는?", options: ["산소", "질소", "이산화탄소", "수소"], correctAnswer: 1 },
      { category: "science", question: "전기의 단위는?", options: ["와트", "볼트", "암페어", "옴"], correctAnswer: 2 },
      { category: "science", question: "소리의 전달 매체가 필요 없는 것은?", options: ["진공", "공기", "물", "고체"], correctAnswer: 0 },
      { category: "science", question: "혈액의 적혈구 수명은?", options: ["30일", "60일", "90일", "120일"], correctAnswer: 3 },
      { category: "science", question: "뉴턴의 운동 법칙은 몇 개인가?", options: ["2개", "3개", "4개", "5개"], correctAnswer: 1 }
    ];

    quizData.forEach(data => {
      const question: QuizQuestion = {
        id: this.currentQuestionId++,
        category: data.category,
        question: data.question,
        options: data.options,
        correctAnswer: data.correctAnswer
      };
      this.questions.set(question.id, question);
    });
  }

  async getQuestionsByCategory(category: string): Promise<QuizQuestion[]> {
    const questions = Array.from(this.questions.values())
      .filter(q => q.category === category);
    
    // Shuffle questions
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    
    return questions;
  }

  async getAllQuestions(): Promise<QuizQuestion[]> {
    return Array.from(this.questions.values());
  }

  async saveGameHistory(game: InsertGameHistory): Promise<GameHistory> {
    const id = this.currentHistoryId++;
    const gameHistory: GameHistory = {
      ...game,
      id,
      createdAt: new Date()
    };
    this.history.set(id, gameHistory);
    return gameHistory;
  }

  async getGameHistory(limit: number = 5): Promise<GameHistory[]> {
    const games = Array.from(this.history.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    return games;
  }

  async getBestScore(category?: string): Promise<number> {
    const games = Array.from(this.history.values());
    
    if (category) {
      const categoryGames = games.filter(g => g.category === category);
      return categoryGames.length > 0 
        ? Math.max(...categoryGames.map(g => g.score)) 
        : 0;
    }
    
    return games.length > 0 
      ? Math.max(...games.map(g => g.score)) 
      : 0;
  }

  async saveGameAnswers(answers: InsertGameAnswer[]): Promise<void> {
    answers.forEach(answer => {
      const id = this.currentAnswerId++;
      const gameAnswer: GameAnswer = { ...answer, id };
      this.answers.set(id, gameAnswer);
    });
  }

  async getQuizStats(): Promise<QuizStats> {
    const games = Array.from(this.history.values());
    
    if (games.length === 0) {
      return {
        bestScore: 0,
        averageScore: 0,
        totalGames: 0,
        bestScores: {
          general: 0,
          history: 0,
          science: 0
        }
      };
    }

    const bestScore = Math.max(...games.map(g => g.score));
    const averageScore = Math.round(
      games.reduce((sum, g) => sum + g.score, 0) / games.length
    );

    const bestScores = {
      general: await this.getBestScore('general'),
      history: await this.getBestScore('history'),
      science: await this.getBestScore('science')
    };

    return {
      bestScore,
      averageScore,
      totalGames: games.length,
      bestScores
    };
  }
}

export const storage = new DatabaseStorage();
