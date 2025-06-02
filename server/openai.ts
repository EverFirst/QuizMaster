import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
};

export async function generateQuizQuestion(category: string, type: string = "multiple_choice", existingQuestions: string[] = []): Promise<QuizQuestion> {
  const categoryPrompts = {
    general: "일반상식에 관한 퀴즈 문제를 생성해주세요. 한국어로 작성하고, 다양한 주제(지리, 상식, 문화, 스포츠 등)를 포함해주세요.",
    history: "역사에 관한 퀴즈 문제를 생성해주세요. 한국사, 세계사를 포함하여 한국어로 작성해주세요.",
    science: "과학에 관한 퀴즈 문제를 생성해주세요. 물리, 화학, 생물, 지구과학 등을 포함하여 한국어로 작성해주세요."
  };

  let prompt = categoryPrompts[category as keyof typeof categoryPrompts] || categoryPrompts.general;

  // 기존 문제들이 있으면 중복 방지 지시사항 추가
  if (existingQuestions.length > 0) {
    prompt += `\n\n다음 기존 문제들과 중복되지 않도록 완전히 새로운 문제를 생성해주세요:\n${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
  }

  // 문제 유형에 따른 시스템 프롬프트 설정
  const systemContent = type === "fill_blank" 
    ? `당신은 한국어 퀴즈 문제 제작 전문가입니다. 다음 조건에 맞는 빈칸채우기 문제를 생성해주세요:
1. 문제는 명확하고 이해하기 쉬워야 합니다
2. 빈칸 위치에 반드시 ______ (언더바 6개)를 사용해주세요
3. 여러 개의 가능한 정답을 제공해주세요 (동의어, 다른 표현 포함)
4. 2-3개의 힌트를 제공해주세요
5. 난이도는 일반인이 도전할 만한 수준으로 해주세요
6. 기존 문제들과 완전히 다른 새로운 문제를 만들어주세요
7. JSON 형식으로 응답해주세요: {"question": "빈칸이 포함된 문제내용", "correctAnswers": ["정답1", "정답2", "정답3"], "hints": ["힌트1", "힌트2"]}`
    : `당신은 한국어 퀴즈 문제 제작 전문가입니다. 다음 조건에 맞는 객관식 문제를 생성해주세요:
1. 문제는 명확하고 이해하기 쉬워야 합니다
2. 4개의 선택지를 제공해주세요
3. 정답은 하나만 있어야 합니다
4. 난이도는 일반인이 도전할 만한 수준으로 해주세요
5. 기존 문제들과 완전히 다른 새로운 문제를 만들어주세요
6. JSON 형식으로 응답해주세요: {"question": "문제내용", "options": ["선택지1", "선택지2", "선택지3", "선택지4"], "correctAnswer": 정답번호(0-3)}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemContent,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // 문제 유형에 따른 응답 검증
    if (type === "fill_blank") {
      if (!result.question || !result.correctAnswers || !Array.isArray(result.correctAnswers) ||
          result.correctAnswers.length === 0) {
        throw new Error("Invalid fill_blank response format from OpenAI");
      }

      return {
        question: result.question,
        options: [],
        correctAnswer: 0,
        correctAnswers: result.correctAnswers,
        hints: result.hints || []
      };
    } else {
      if (!result.question || !result.options || !Array.isArray(result.options) || 
          result.options.length !== 4 || typeof result.correctAnswer !== "number" ||
          result.correctAnswer < 0 || result.correctAnswer > 3) {
        throw new Error("Invalid multiple_choice response format from OpenAI");
      }

      return {
        question: result.question,
        options: result.options,
        correctAnswer: result.correctAnswer,
        correctAnswers: [],
        hints: []
      };
    }
  } catch (error) {
    console.error("Error generating quiz question:", error);
    throw new Error("문제 생성 중 오류가 발생했습니다: " + (error as Error).message);
  }
}