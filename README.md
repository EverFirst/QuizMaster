# 한국어 인터랙티브 퀴즈 애플리케이션

다양한 카테고리와 문제 유형을 지원하는 한국어 기반 교육용 퀴즈 게임 플랫폼입니다.

## 🎯 주요 기능

### 1. 다양한 문제 유형
- **객관식 문제**: 4지선다 형태의 전통적인 퀴즈 문제
- **빈칸채우기 문제**: 여러 정답 허용 및 힌트 시스템 지원

### 2. 카테고리별 문제
- **일반상식**: 지리, 상식, 문화, 스포츠 등 다양한 주제
- **역사**: 한국사, 세계사 문제
- **과학**: 물리, 화학, 생물, 지구과학 문제

### 3. 게임 시스템
- **타이머 기능**: 문제당 30초 제한 시간
- **실시간 점수 계산**: 정답 속도에 따른 점수 차등 지급
- **게임 히스토리**: 이전 게임 결과 저장 및 조회
- **통계 시스템**: 최고 점수, 평균 점수, 총 게임 수 추적

### 4. 관리자 기능
- **문제 관리**: 새로운 문제 추가, 수정, 삭제
- **AI 문제 생성**: OpenAI를 활용한 자동 문제 생성
- **중복 방지**: 기존 문제와 중복되지 않는 새로운 문제 생성
- **문제 유형 선택**: 객관식 또는 빈칸채우기 문제 생성 선택

### 5. 사용자 경험
- **반응형 디자인**: 모바일 및 데스크톱 지원
- **다크/라이트 테마**: 사용자 선호에 따른 테마 변경
- **실시간 피드백**: 정답/오답 즉시 표시
- **힌트 시스템**: 빈칸채우기 문제에서 단계별 힌트 제공

## 🛠 기술 스택

### Frontend
- **React**: 컴포넌트 기반 UI 라이브러리
- **TypeScript**: 타입 안전성을 위한 정적 타입 언어
- **Tailwind CSS**: 유틸리티 기반 CSS 프레임워크
- **shadcn/ui**: 현대적인 UI 컴포넌트 라이브러리
- **Wouter**: 경량 라우터 라이브러리
- **TanStack Query**: 서버 상태 관리 및 캐싱
- **React Hook Form**: 폼 상태 관리

### Backend
- **Express.js**: Node.js 웹 프레임워크
- **TypeScript**: 백엔드 타입 안전성
- **Drizzle ORM**: 타입 안전한 SQL 쿼리 빌더
- **PostgreSQL**: 관계형 데이터베이스

### AI 통합
- **OpenAI GPT-4o**: 문제 생성을 위한 AI 모델
- **자연어 처리**: 한국어 문제 생성 및 검증

### 개발 도구
- **Vite**: 빠른 빌드 도구 및 개발 서버
- **ESLint**: 코드 품질 관리
- **Prettier**: 코드 포맷팅

## 📁 프로젝트 구조

```
project/
├── client/                     # Frontend 코드
│   ├── src/
│   │   ├── components/         # 재사용 가능한 컴포넌트
│   │   │   ├── ui/            # shadcn/ui 컴포넌트
│   │   │   ├── fill-blank-question.tsx
│   │   │   ├── loading-overlay.tsx
│   │   │   └── toast-notification.tsx
│   │   ├── pages/             # 페이지 컴포넌트
│   │   │   ├── home.tsx       # 메인 페이지
│   │   │   ├── game.tsx       # 게임 페이지
│   │   │   ├── result.tsx     # 결과 페이지
│   │   │   ├── admin.tsx      # 관리자 페이지
│   │   │   └── not-found.tsx  # 404 페이지
│   │   ├── hooks/             # 커스텀 훅
│   │   ├── lib/               # 유틸리티 함수
│   │   └── App.tsx            # 메인 앱 컴포넌트
├── server/                     # Backend 코드
│   ├── routes.ts              # API 라우트 정의
│   ├── storage.ts             # 데이터 저장소 인터페이스
│   ├── db.ts                  # 데이터베이스 연결
│   ├── openai.ts              # AI 문제 생성
│   └── index.ts               # 서버 진입점
├── shared/                     # 공유 타입 및 스키마
│   └── schema.ts              # 데이터베이스 스키마 정의
└── package.json               # 프로젝트 의존성
```

## 🗄 데이터베이스 스키마

### quiz_questions 테이블
```sql
- id: 문제 고유 ID
- category: 문제 카테고리 (general, history, science)
- question: 문제 내용
- type: 문제 유형 (multiple_choice, fill_blank)
- options: 객관식 선택지 (JSON 배열)
- correct_answer: 객관식 정답 번호
- correct_answers: 빈칸채우기 정답들 (JSON 배열)
- hints: 힌트 목록 (JSON 배열)
```

### game_history 테이블
```sql
- id: 게임 세션 ID
- category: 게임 카테고리
- score: 획득 점수
- total_questions: 총 문제 수
- correct_answers: 정답 수
- time_spent: 소요 시간
- accuracy: 정확도
- created_at: 게임 완료 시간
```

### game_answers 테이블
```sql
- id: 답안 ID
- game_id: 게임 세션 참조
- question_id: 문제 참조
- selected_answer: 선택한 답안 (객관식)
- user_answer: 사용자 입력 (빈칸채우기)
- is_correct: 정답 여부
- partial_score: 부분 점수
```

## 🚀 실행 방법

### 환경 요구사항
- Node.js 18 이상
- PostgreSQL 데이터베이스
- OpenAI API 키

### 환경 변수 설정
```env
DATABASE_URL=postgresql://username:password@localhost:5432/quiz_db
OPENAI_API_KEY=your_openai_api_key_here
```

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 데이터베이스 스키마 적용
npm run db:push

# 개발 서버 시작
npm run dev
```

애플리케이션이 http://localhost:5000 에서 실행됩니다.

## 🎮 사용 방법

### 일반 사용자
1. 메인 페이지에서 원하는 카테고리 선택
2. 게임 시작 후 제한 시간 내에 문제 해결
3. 객관식: 정답 선택 / 빈칸채우기: 답안 입력 후 힌트 활용
4. 게임 완료 후 결과 확인 및 통계 보기

### 관리자
1. 관리자 페이지 접속 (비밀번호: admin123)
2. 새로운 문제 수동 추가 또는 AI 생성 활용
3. 문제 유형 선택 (객관식/빈칸채우기)
4. 기존 문제 관리 및 수정

## 🔧 주요 기능 구현

### AI 문제 생성
- OpenAI GPT-4o 모델 활용
- 문제 유형별 맞춤형 프롬프트
- 기존 문제와의 중복 방지 로직
- 한국어 자연어 처리 최적화

### 실시간 점수 계산
```typescript
// 답안 속도에 따른 점수 계산
const baseScore = 10;
const timeBonus = Math.max(0, timeLeft);
const finalScore = baseScore + timeBonus;
```

### 다중 정답 처리
```typescript
// 빈칸채우기 문제의 다중 정답 검증
const isCorrect = correctAnswers.some(answer => 
  userAnswer.trim().toLowerCase() === answer.trim().toLowerCase()
);
```

### 타이머 시스템
- 문제당 30초 제한
- 실시간 카운트다운 표시
- 시간 초과 시 자동 다음 문제 이동

## 🔒 보안 기능
- 관리자 페이지 비밀번호 보호
- API 엔드포인트 입력 검증
- SQL 인젝션 방지 (Drizzle ORM)
- XSS 방지를 위한 입력 새니타이징

## 📊 통계 및 분석
- 개인별 게임 히스토리 추적
- 카테고리별 최고 점수 기록
- 평균 점수 및 정확도 계산
- 게임 플레이 패턴 분석

## 🎨 UI/UX 특징
- 현대적이고 직관적인 인터페이스
- 애니메이션과 트랜지션 효과
- 접근성을 고려한 키보드 네비게이션
- 반응형 디자인으로 모든 기기 지원

## 🔄 확장 가능성
- 새로운 문제 카테고리 추가 용이
- 다양한 문제 유형 확장 가능
- 멀티플레이어 모드 구현 가능
- 학습 진도 추적 시스템 추가 가능

## 📝 라이선스
이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여 방법
1. 이슈 등록을 통한 버그 리포트 또는 기능 제안
2. 풀 리퀘스트를 통한 코드 기여
3. 문서 개선 및 번역 기여

---

**개발자**: Replit을 활용한 풀스택 개발
**버전**: 1.0.0
**최종 업데이트**: 2025년 6월