# 소프트웨어 기술 명세서

## 1. 문서 개요
본 문서는 'AI 기반 콘텐츠 생성 웹 애플리케이션'의 개발에 필요한 기술 스택, 시스템 아키텍처, 모듈별 상세 명세, 데이터 모델, 테스트 및 배포 전략을 구체적으로 정의한다. '요구사항 문서'와 '고수준 설계 문서(HLD)'를 기반으로 작성되었다.

## 2. 기술 스택 (Technology Stack)
- **프레임워크:** Next.js 13+ (App Router)
- **프로그래밍 언어:** TypeScript 5.x
- **UI 라이브러리:** React 18+
- **상태 관리:** React `useState`, `useContext` (컴포넌트 지역 상태)
- **스타일링:** Tailwind CSS 또는 CSS Modules
- **API 통신:** Fetch API (클라이언트-서버), Axios (서버-외부 API)
- **테스트 프레임워크:** Jest (단위/통합), React Testing Library (컴포넌트)
- **배포 플랫폼:** Vercel

## 3. 시스템 아키텍처
고수준 설계 문서에 정의된 3-Tier 서버리스 아키텍처를 따른다.
- **Client (Browser):** Next.js로 빌드된 React 기반 UI
- **API Layer (Serverless Functions):** Next.js API Routes
- **External Service:** 외부 LLM API (예: OpenAI GPT)

## 4. 디렉토리 구조 (제안)
```
/
├── /app/
│   ├── /api/
│   │   ├── /generate-sentence/
│   │   │   └── route.ts      # 영어 문장 생성 API
│   │   └── /generate-celebration/
│   │       └── route.ts      # 축하 문구 생성 API
│   ├── /english-sentence/
│   │   └── page.tsx          # 영어 문장 생성 페이지
│   ├── /celebration-message/
│   │   └── page.tsx          # 축하 문구 생성 페이지
│   ├── layout.tsx            # 공통 레이아웃
│   └── page.tsx              # 메인 페이지
├── /components/
│   ├── ui/                   # 재사용 가능한 기본 UI (Button, Card 등)
│   ├── InputForm.tsx         # 공통 입력 폼
│   └── ResultDisplay.tsx     # 결과 표시 영역
├── /lib/                     # 유틸리티, 헬퍼 함수
├── /styles/                  # 전역 스타일
└── /__tests__/               # 테스트 코드

**참고: 테스트 파일**
- 테스트 파일(`*.test.ts`, `*.test.tsx`)은 테스트 대상 파일과 동일한 디렉토리에 위치시키는 Co-location 전략을 사용합니다.
- 예: `/components/InputForm.test.tsx`는 `InputForm.tsx`의 테스트 파일입니다.

## 5. 모듈별 상세 명세
### 5.1. API 계층 (Serverless Functions)
#### 5.1.1. 영어 문장 생성 (`/api/generate-sentence`)
- **HTTP Method:** `POST`
- **Request Body:**
  ```typescript
  interface GenerateSentenceRequest {
    text: string; // 사용자가 입력한 영어 문장 (최대 500자)
    level: '초급' | '중급' | '고급';
  }
  ```
- **Response Body (Success):**
  ```typescript
  interface GenerateSentenceResponse {
    sentences: string[];
  }
  ```
- **핵심 로직:**
  1. Request Body 유효성 검증 (텍스트 길이, 레벨 값).
  2. 입력받은 `text`와 `level`을 조합하여 LLM에 전달할 프롬프트 생성.
     - 예: `"${text}" 문장을 활용해서, ${level} 수준의 영어 예문 3개를 만들어줘.`
  3. 환경 변수에 저장된 API 키를 사용하여 외부 LLM API 호출.
  4. LLM 응답을 파싱하여 `sentences` 배열로 가공 후 반환.
  5. 오류 발생 시 표준 오류 응답 반환.

#### 5.1.2. 축하 문구 생성 (`/api/generate-celebration`)
- **HTTP Method:** `POST`
- **Request Body:**
  ```typescript
  interface GenerateCelebrationRequest {
    situation: string; // 사용자가 입력한 상황 (최대 500자)
    tone: '유머러스' | '감동적' | '센스있는';
  }
  ```
- **Response Body (Success):**
  ```typescript
  interface GenerateCelebrationResponse {
    messages: string[];
  }
  ```
- **핵심 로직:**
  1. 영어 문장 생성 API와 유사한 로직 수행.
  2. 프롬프트 예: `"${situation}" 상황에 어울리는 ${tone} 톤의 축하 메시지 3개를 만들어줘.`

### 5.2. 프론트엔드 컴포넌트
- **`InputForm.tsx`**:
  - `textarea`, `select`, `button` 엘리먼트로 구성.
  - 버튼 클릭 시 `isLoading` 상태를 `true`로 변경하고, 상위 컴포넌트로 `onSubmit` 콜백 함수 호출.
- **`ResultDisplay.tsx`**:
  - `results` 배열을 props로 받아 리스트 또는 카드 형태로 렌더링.
  - 각 항목에 '클립보드 복사' 버튼 포함. `navigator.clipboard.writeText()` API 사용.

## 6. 데이터베이스 설계
- 요구사항에 따라 별도의 데이터베이스를 사용하지 않으며, 모든 데이터 처리는 일회성으로 메모리에서만 이루어진다.

## 7. 환경변수 관리
### 7.1. 환경변수 구성

모든 민감한 정보와 설정값은 환경변수를 통해 관리하며, 다음과 같은 계층 구조를 따른다:

```bash
# 개발 환경 (.env.local)
OPENAI_API_KEY=sk-...                              # OpenAI API 키
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
OPENAI_MODEL=gpt-3.5-turbo                         # 사용할 모델

# 애플리케이션 설정
NEXT_PUBLIC_APP_NAME=AI Solution Hub
NEXT_PUBLIC_APP_VERSION=1.0.0

# API 설정
API_RATE_LIMIT=10                                  # 분당 요청 제한
API_TIMEOUT=30000                                  # 타임아웃 (ms)
```

### 7.2. 환경변수 보안 관리

- **개발 환경:** `.env.local` 파일 사용 (Git에 커밋하지 않음)
- **프로덕션 환경:** Vercel Dashboard의 Environment Variables 섹션에서 관리
- **예시 파일:** `.env.example` 파일로 필요한 환경변수 목록 제공
- **접두사 규칙:**
  - `NEXT_PUBLIC_`: 클라이언트에서 접근 가능한 환경변수
  - 접두사 없음: 서버사이드에서만 접근 가능한 환경변수

### 7.3. API 키 관리 전략

- **동적 LLM 선택:** `LLM_PROVIDER` 환경변수로 기본 LLM API 지정
- **Fallback 지원:** `LLM_FALLBACK_PROVIDER`로 장애 시 대체 API 자동 전환
- **환경변수 감지:** 코드에서 `getAvailableProviders()` 함수로 사용 가능한 API 자동 감지
- **API 키 검증:**
  - `OPENAI_API_KEY`: OpenAI API 사용 시 필수
  - `GEMINI_API_KEY`: Google Gemini API 사용 시 필수
  - `CLAUDE_API_KEY`: Anthropic Claude API 사용 시 필수
- **설정 예시:**

  ```bash
  # 기본 OpenAI 사용, Gemini를 fallback으로 설정
  LLM_PROVIDER=openai
  LLM_FALLBACK_PROVIDER=gemini
  OPENAI_API_KEY=sk-...
  GEMINI_API_KEY=AIza...
  ```

- **키 로테이션:** 정기적인 API 키 갱신 권장
- **접근 제한:** API Routes에서만 환경변수 접근, 클라이언트 코드에서는 접근 불가

### 7.4. 환경변수 변경 감지

코드에서 환경변수 변경을 자동 감지하는 메커니즘:

- **`validateLLMConfig()`**: 서버 시작 시 환경변수 검증 및 경고 출력
- **`getAvailableProviders()`**: 런타임에 사용 가능한 LLM API 목록 동적 생성
- **`getPrimaryProvider()`**: `LLM_PROVIDER` 값 변경 시 자동으로 기본 API 변경
- **로깅**: 각 API 호출 시 사용된 provider와 fallback 상태 로그 출력

환경변수 변경 시 애플리케이션 재시작 없이도 새로운 설정이 반영됩니다.

## 8. 보안 고려사항

- **API 키 관리:** LLM API 키는 Vercel의 환경 변수(Environment Variables)에 저장하며, 클라이언트 코드에 절대 노출하지 않는다. 모든 외부 API 호출은 서버리스 함수를 통해서만 이루어진다.
- **입력값 검증:** 서버리스 함수는 클라이언트로부터 받은 모든 입력값(길이, 형식 등)에 대해 유효성 검사를 수행하여 예기치 않은 동작을 방지한다.

## 9. 테스트 전략

- **TDD(테스트 주도 개발):** Jest를 사용하여 테스트 코드를 먼저 작성한 후 기능을 구현한다.
- **단위 테스트:**
  - API 계층: Mock Service Worker(MSW) 또는 `node-mocks-http`를 사용하여 HTTP 요청/응답을 모킹하고, 프롬프트 생성 및 데이터 가공 로직을 테스트한다.
  - 컴포넌트: React Testing Library를 사용하여 props에 따른 렌더링 결과와 사용자 상호작용을 테스트한다.
- **통합 테스트:**
  - 페이지 단위로 컴포넌트와 API 호출 로직을 연동하여 전체 기능 흐름을 테스트한다. API 호출은 모킹하여 외부 의존성을 제거한다.

## 10. 배포 전략

- **브랜치 전략:** `main` 브랜치(배포용), `develop` 브랜치(개발용), `feature/*` 브랜치(기능 개발용)를 사용한다.
- **자동 배포:** Vercel과 GitHub 레포지토리를 연동하여 `main` 브랜치에 푸시될 때마다 자동으로 프로덕션 환경에 빌드 및 배포가 트리거되도록 설정한다.
- **미리보기 배포:** `develop` 브랜치나 PR(Pull Request) 생성 시, Vercel이 자동으로 생성해주는 미리보기 URL을 통해 변경사항을 사전에 검토한다.
