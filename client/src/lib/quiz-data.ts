export const categoryDisplayNames = {
  general: "일반상식",
  history: "역사",
  science: "과학"
} as const;

export const categoryDescriptions = {
  general: "일상생활과 기본 지식",
  history: "세계사와 한국사", 
  science: "물리, 화학, 생물학"
} as const;

export type CategoryKey = keyof typeof categoryDisplayNames;
