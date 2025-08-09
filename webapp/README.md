# AI Solution Hub - 영어 학습 도구

AI를 활용한 영어 학습 도구 모음입니다. 영어 문장 생성, 스토리 생성 등의 기능을 제공합니다.

## 🚀 기능

### ✅ 영어 문장 생성

- 영어 단어 입력 시 난이도별 예시 문장 생성
- 한국어 해석 제공
- TTS(음성 읽기) 기능
- 다의어 처리
- 문장 퍼즐 게임

### ✅ 영어 스토리 생성

- 여러 영어 단어를 활용한 스토리 생성
- 3단계 난이도 선택 (쉬움/보통/어려움)
- 한국어 해석 토글
- TTS 음성 재생
- 다의어 처리

### ⏳ 축하 문구 생성 (예정)

- 상황별 맞춤 축하 문구 생성
- 다양한 톤앤매너 지원

## 🛠️ 설치 및 실행

### 1. 프로젝트 클론

\`\`\`bash
git clone <https://github.com/gabrielwithappy/ai-solution-hub.git>
cd ai-solution-hub/webapp
\`\`\`

### 2. 의존성 설치

\`\`\`bash
npm install
\`\`\`

### 3. 환경 변수 설정

프로젝트 루트에 \`.env.local\` 파일을 생성하고 다음 중 하나 이상의 LLM API 키를 설정하세요:

\`\`\`env

# OpenAI API (추천)

OPENAI_API_KEY=sk-your-openai-api-key-here

# Google Gemini API (대안)

GEMINI_API_KEY=your-gemini-api-key-here

# Anthropic Claude API (대안)

CLAUDE_API_KEY=your-claude-api-key-here

# 기본 사용할 LLM Provider 선택 (선택사항)

LLM_PROVIDER=openai
\`\`\`

#### API 키 발급 방법

**OpenAI API (추천)**

1. [OpenAI Platform](https://platform.openai.com/api-keys)에 접속
2. 계정 로그인 후 API 키 생성
3. 생성된 키를 \`OPENAI_API_KEY\`에 설정

**Google Gemini API**

1. [Google AI Studio](https://makersuite.google.com/app/apikey)에 접속
2. API 키 생성
3. 생성된 키를 \`GEMINI_API_KEY\`에 설정

**Anthropic Claude API**

1. [Anthropic Console](https://console.anthropic.com/)에 접속
2. API 키 생성
3. 생성된 키를 \`CLAUDE_API_KEY\`에 설정

### 4. 개발 서버 실행

\`\`\`bash
npm run dev
\`\`\`

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어서 확인하세요.

## 🧪 테스트

### 전체 테스트 실행

\`\`\`bash
npm test
\`\`\`

### 특정 기능 테스트

\`\`\`bash

# 영어 스토리 생성 기능 테스트

npm test -- --testPathPatterns=english-story

# TTS 기능 테스트

npm test -- --testPathPatterns=tts
\`\`\`

## 📁 프로젝트 구조

\`\`\`
webapp/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── english-sentence/   # 영어 문장 생성 페이지
│   │   ├── english-story/      # 영어 스토리 생성 페이지
│   │   └── api/               # API 라우트
│   ├── components/            # React 컴포넌트
│   │   ├── ui/               # 공통 UI 컴포넌트
│   │   └── *.tsx             # 기능별 컴포넌트
│   └── lib/                  # 유틸리티 함수
│       ├── llm-client.ts     # LLM API 클라이언트
│       ├── llm-config.ts     # LLM 설정 관리
│       ├── english-story.ts  # 영어 스토리 생성 로직
│       └── tts.ts           # TTS 기능
├── **tests**/               # 테스트 파일
└── README.md
\`\`\`

## 🔧 기술 스택

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Testing**: Jest, React Testing Library
- **LLM APIs**: OpenAI GPT, Google Gemini, Anthropic Claude
- **Voice**: Web Speech API
- **Deployment**: Vercel (권장)

## 🌟 주요 기능 설명

### LLM Provider 자동 선택

시스템은 설정된 API 키를 기반으로 자동으로 사용 가능한 LLM Provider를 선택합니다:

1. **Primary Provider**: \`LLM_PROVIDER\` 환경 변수로 지정 (기본값: openai)
2. **Fallback 지원**: Primary가 실패하면 다른 Provider로 자동 전환
3. **동적 감지**: 런타임에 API 키 변경 감지

### TDD 개발 방식

모든 기능은 테스트 주도 개발(TDD) 방식으로 구현되었습니다:

- 100% 테스트 커버리지 목표
- 단위 테스트 + 통합 테스트
- 에러 케이스 완전 커버

## 🚀 배포

### Vercel 배포 (권장)

\`\`\`bash

# Vercel CLI 설치

npm i -g vercel

# 배포

vercel

# 환경 변수 설정

vercel env add OPENAI_API_KEY
\`\`\`

### 기타 플랫폼

- **Netlify**: \`npm run build\` 후 \`out\` 폴더 배포
- **Docker**: Dockerfile 포함 (추후 제공 예정)

## 📝 개발 가이드

### 새로운 기능 추가 시

1. **브랜치 생성**
   \`\`\`bash
   git checkout -b feature/new-feature
   \`\`\`

2. **TDD 방식 개발**
   - 테스트 작성 먼저
   - 기능 구현
   - 리팩토링

3. **테스트 확인**
   \`\`\`bash
   npm test
   \`\`\`

4. **커밋 및 PR**
   \`\`\`bash
   git add .
   git commit -m "feat: 새로운 기능 추가"
   git push origin feature/new-feature
   \`\`\`

## 📚 API 문서

### POST /api/generate-story

영어 스토리를 생성합니다.

**Request Body:**
\`\`\`json
{
  "words": [
    {"englishWord": "cat", "koreanMeaning": "고양이"},
    {"englishWord": "happy", "koreanMeaning": "행복한"}
  ],
  "difficulty": "easy"
}
\`\`\`

**Response:**
\`\`\`json
{
  "englishStory": "The cat was happy...",
  "koreanTranslation": "고양이는 행복했다...",
  "usedWords": [...],
  "difficulty": "easy"
}
\`\`\`

## 🤝 기여하기

1. 이슈 생성 또는 기존 이슈 확인
2. 포크 및 브랜치 생성
3. TDD 방식으로 개발
4. 테스트 통과 확인
5. Pull Request 생성

## 📄 라이센스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🆘 문제 해결

### API 키 관련 오류

\`\`\`
Error: OpenAI API 키가 설정되지 않았습니다.
\`\`\`
→ \`.env.local\` 파일에 올바른 API 키가 설정되었는지 확인하세요.

### 테스트 실패

\`\`\`
Tests failed
\`\`\`
→ \`npm test\`로 상세한 오류 메시지를 확인하고, 관련 컴포넌트를 수정하세요.

### 빌드 오류

\`\`\`
Build failed
\`\`\`
→ TypeScript 오류를 확인하고, \`npm run type-check\`로 타입 검사를 실행하세요.

---

더 자세한 정보나 문의사항은 [GitHub Issues](https://github.com/gabrielwithappy/ai-solution-hub/issues)를 이용해주세요.
