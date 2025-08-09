# 고수준 설계 문서 (High-Level Design)

## 1. 개요

본 문서는 AI 기반 콘텐츠 생성 웹 애플리케이션의 고수준 아키텍처, 주요 구성 요소 및 시스템 흐름을 정의한다. 사용자의 요청에 따라 LLM(거대 언어 모델)을 활용하여 동적 콘텐츠를 생성하는 것을 목표로 하며, 요구사항에 명시된 대로 서버리스 아키텍처를 기반으로 설계되었다.

## 2. 시스템 목표

- **기능 목표:**
  - 사용자가 입력한 텍스트(영어 문장, 상황)에 따라 AI가 연관 콘텐츠(예시 문장, 축하 문구)를 생성한다.
  - 기능별로 분리된 UI를 통해 사용자에게 직관적인 경험을 제공한다.
  - **TTS(Text-to-Speech) 기능**을 통해 생성된 영어 문장을 음성으로 재생하여 학습 효과를 높인다.
- **기술 목표:**
  - 별도의 백엔드 서버 없이 프론트엔드 중심의 기술 스택으로 MVP를 구현한다.
  - 배포 및 운영이 간편한 서버리스 아키텍처를 채택한다.
  - TDD(테스트 주도 개발)를 통해 코드의 안정성과 유지보수성을 확보한다.
  - **브라우저 네이티브 Web Speech API**를 활용하여 별도의 외부 서비스 없이 TTS 기능을 구현한다.

## 3. 시스템 아키텍처

애플리케이션은 클라이언트, API 계층, 외부 서비스의 3-Tier 아키텍처로 구성되며, 클라이언트에서 브라우저 네이티브 TTS 기능을 활용한다.

```
+---------------------------+      +------------------------+      +--------------------+
|                           |      |                        |      |                    |
|     User/Browser          |----->|  Next.js Frontend App  |----->|  External LLM API  |
|       (Client)            |<-----| (Vercel/Netlify)       |<-----| (e.g., OpenAI)     |
|                           |      |   - UI Components      |      |                    |
| +----------------------+  |      |   - API Routes (Proxy) |      |                    |
| | Web Speech API       |  |      |                        |      |                    |
| | (Browser Native TTS) |  |      |                        |      |                    |
| +----------------------+  |      |                        |      |                    |
|                           |      |                        |      |                    |
+---------------------------+      +------------------------+      +--------------------+
            |
            v
    +----------------+
    |  Audio Output  |
    | (Speaker/      |
    |  Headphones)   |
    +----------------+
```

**아키텍처 구성 요소:**

- **클라이언트 (Client):** 사용자가 직접 상호작용하는 웹 브라우저로, 브라우저 네이티브 Web Speech API를 포함한다.
- **Next.js 애플리케이션 (Frontend & API Layer):**
  - **프론트엔드:** React 컴포넌트로 구성된 UI를 사용자에게 제공한다.
  - **API 계층 (프록시):** Next.js의 API Routes를 서버리스 함수로 사용하여 클라이언트의 요청을 받아 외부 LLM API로 전달하는 프록시 역할을 수행한다. API 키와 같은 민감 정보를 안전하게 관리한다.
- **외부 서비스 (External Service):** 실제 AI 연산을 수행하는 외부 LLM API.
- **Web Speech API:** 브라우저에 내장된 TTS 기능으로, 별도의 외부 서비스 없이 클라이언트에서 직접 음성 합성 및 재생을 처리한다.
- **Audio Output:** 스피커나 헤드폰을 통해 합성된 음성을 사용자에게 전달한다.

**아키텍처의 주요 특징:**

- **서버리스 구조:** 별도의 백엔드 서버 없이 프론트엔드와 서버리스 함수만으로 구성
- **클라이언트 중심 TTS:** 서버 리소스를 사용하지 않고 브라우저 네이티브 API로 TTS 처리
- **외부 의존성 최소화:** LLM API를 제외하고는 모든 기능을 자체적으로 처리

## 4. 주요 구성 요소

### 4.1. 클라이언트 애플리케이션 (Client Application)

- **역할:** 사용자 인터페이스 제공, 사용자 입력 처리, 결과 데이터 시각화, TTS 음성 재생.
- **구현:** Next.js와 React를 사용하여 구현된 단일 페이지 애플리케이션(SPA).
- **주요 모듈:**
  - **UI 렌더링 모듈:** 사용자의 요청에 따라 적절한 페이지와 컴포넌트를 렌더링.
  - **상태 관리 모듈:** 사용자의 입력, API 호출 상태(로딩, 성공, 실패), 결과 데이터, TTS 재생 상태를 관리.
  - **API 통신 모듈:** 내부 API 계층(Next.js API Routes)에 HTTP 요청을 전송.
  - **TTS 모듈:** Web Speech API를 활용하여 텍스트를 음성으로 변환 및 재생하는 기능을 제공.

### 4.2. API 계층 (API Layer)

- **역할:** 클라이언트와 외부 LLM 서비스 간의 안전한 중계자. 비즈니스 로직(프롬프트 생성) 처리.
- **구현:** Next.js API Routes를 활용한 서버리스 함수.
- **주요 기능:**
  - **인증 및 보안:** 외부로 노출되어서는 안 되는 LLM API 키를 서버 환경 변수로 안전하게 관리.
  - **프롬프트 엔지니어링:** 클라이언트로부터 받은 데이터를 바탕으로 LLM이 이해할 수 있는 최적의 프롬프트를 동적으로 생성.
  - **데이터 변환:** LLM API의 응답을 클라이언트가 사용하기 쉬운 포맷(JSON)으로 가공하여 전달.
  - **다중 프로바이더 지원:** OpenAI, Google Gemini, Anthropic Claude 등 여러 LLM 프로바이더를 지원.
  - **자동 폴백:** Primary 프로바이더 실패 시 자동으로 Fallback 프로바이더로 전환.

### 4.3. LLM 통합 계층 (LLM Integration Layer)

본 시스템은 다중 LLM 프로바이더를 지원하는 통합 계층을 구현하여 높은 가용성과 유연성을 제공한다.

#### 4.3.1. LLM 클라이언트 아키텍처

```
┌─────────────────────────────────────────────┐
│              API Routes                     │
│  ┌─────────────────┬─────────────────────┐   │
│  │ generate-story  │ generate-sentence   │   │
│  └─────────────────┴─────────────────────┘   │
│                     │                       │
│              ┌─────────────┐                │
│              │  callLLM    │                │
│              │ (Unified    │                │
│              │  Client)    │                │
│              └─────────────┘                │
│                     │                       │
│    ┌────────────────┼────────────────┐      │
│    │                │                │      │
│ ┌──▼───┐      ┌──▼───┐        ┌──▼───┐     │
│ │OpenAI│      │Gemini│        │Claude│     │
│ │ API  │      │ API  │        │ API  │     │
│ └──────┘      └──────┘        └──────┘     │
└─────────────────────────────────────────────┘
```

#### 4.3.2. 핵심 구성 요소

- **`callLLM` 함수:** 모든 LLM API 호출을 통일된 인터페이스로 처리
  - Primary/Fallback 프로바이더 자동 전환
  - 표준화된 요청/응답 포맷
  - 에러 처리 및 재시도 로직

- **`validateLLMConfig` 함수:** LLM 설정 유효성 검사
  - 환경변수에서 API 키 존재 여부 확인
  - 사용 가능한 프로바이더 목록 반환
  - 설정 문제 시 상세한 에러 메시지 제공

- **프로바이더별 구현:**
  - `callOpenAI`: OpenAI GPT 모델 호출
  - `callGemini`: Google Gemini 모델 호출
  - `callClaude`: Anthropic Claude 모델 호출

#### 4.3.3. 환경별 호출 전략

```typescript
// 프로덕션 환경: 실제 LLM API 호출
if (process.env.NODE_ENV !== 'test') {
    const llmResponse = await callLLM({
        prompt: generatedPrompt,
        maxTokens: getMaxTokensForDifficulty(difficulty),
        temperature: 0.7
    });
    
    result = {
        ...parseApiResponse(llmResponse.content),
        provider: llmResponse.provider
    };
}

// 테스트 환경: Mock 응답 사용
else {
    result = {
        ...await generateMockResponse(),
        provider: 'test-mock'
    };
}
```

#### 4.3.4. 프로바이더 우선순위 및 폴백

1. **Primary Provider:** 환경변수 `LLM_PROVIDER`로 지정 (기본값: 'gemini')
2. **Fallback Provider:** Primary 실패 시 자동으로 사용 가능한 다른 프로바이더 선택
3. **지원 프로바이더:**
   - `openai`: OpenAI GPT-4/GPT-3.5
   - `gemini`: Google Gemini Pro
   - `claude`: Anthropic Claude

#### 4.3.5. 응답 표준화

모든 프로바이더의 응답을 다음 표준 형식으로 변환:

```typescript
interface LLMResponse {
    content: string;
    provider: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
```

### 4.4. 외부 LLM 서비스 (External LLM Service)

- **역할:** 자연어 처리 및 콘텐츠 생성.
- **선택:** OpenAI(GPT), Google(Gemini) 등 프로젝트 요구사항에 맞는 모델을 선택.
- **연동:** API 계층에서 HTTP 클라이언트를 통해 REST API 방식으로 연동.

## 5. 데이터 흐름

### 5.1. 통합 LLM API 호출 흐름

1. **사용자 입력:** 사용자가 웹 UI에서 텍스트(상황, 영어 단어 등)를 입력하고 '생성' 버튼을 클릭한다.
2. **API Route 선택:** 기능에 따라 적절한 API 엔드포인트로 요청이 전달된다:
   - `/api/generate-story`: 영어 단어 기반 스토리 생성
   - `/api/generate-sentence`: 영어 단어 기반 예문 생성
3. **LLM 설정 검증:** `validateLLMConfig()`를 통해 환경변수와 API 키 설정을 확인한다.
4. **입력값 검증 및 전처리:** 클라이언트로부터 받은 데이터의 유효성을 검사하고 필터링한다.
5. **프롬프트 생성:** 각 기능별 `generatePrompt()` 함수를 통해 LLM에 전달할 최적화된 프롬프트를 생성한다.
6. **통합 LLM 호출:** `callLLM()` 함수를 통해 다음 순서로 처리된다:
   - Primary 프로바이더(환경변수 `LLM_PROVIDER` 기준)로 첫 번째 시도
   - 실패 시 자동으로 Fallback 프로바이더로 전환
   - 모든 프로바이더 실패 시 표준화된 에러 응답 반환
7. **응답 파싱:** `parseApiResponse()` 함수를 통해 LLM의 원시 응답을 구조화된 JSON으로 변환한다.
8. **결과 반환:** 파싱된 데이터와 사용된 프로바이더 정보를 클라이언트에 전달한다.
9. **UI 렌더링:** 클라이언트는 수신한 데이터를 UI에 렌더링하여 사용자에게 표시한다.

### 5.2. 환경별 처리 로직

#### 프로덕션 환경

```typescript
// 실제 LLM API 호출
const llmResponse = await callLLM({
    prompt: generatePrompt(words, difficulty),
    maxTokens: getMaxTokensForDifficulty(difficulty),
    temperature: 0.7
});

const result = {
    ...parseApiResponse(llmResponse.content, words, difficulty),
    provider: llmResponse.provider
};
```

#### 테스트 환경

```typescript
// Mock 응답 사용 (TDD 지원)
const mockResponse = await generateEnglishStory(words, difficulty);
const result = {
    ...mockResponse,
    provider: 'test-mock'
};
```

### 5.3. TTS(음성 재생) 기능 흐름

1. **TTS 요청:** 사용자가 생성된 영어 문장의 '음성 듣기' 버튼을 클릭한다.
2. **브라우저 호환성 확인:** 클라이언트는 `window.speechSynthesis` API 지원 여부를 확인한다.
3. **음성 합성 객체 생성:** `SpeechSynthesisUtterance` 객체를 생성하고 영어 문장 텍스트를 설정한다.
4. **음성 설정 적용:** 언어(`en-US`), 속도, 음성 등 TTS 매개변수를 설정한다.
5. **음성 재생:** `speechSynthesis.speak()` 메서드를 호출하여 음성을 재생한다.
6. **상태 관리:** 재생 중, 완료, 오류 등의 상태를 UI에 반영한다.

## 6. 기술 스택

- **프레임워크:** Next.js (React 포함)
- **언어:** TypeScript
- **테스트:** Jest, React Testing Library
- **TTS:** Web Speech API (브라우저 네이티브)
- **LLM 통합:**
  - **OpenAI:** GPT-4, GPT-3.5-turbo
  - **Google Gemini:** Gemini Pro
  - **Anthropic:** Claude 3 시리즈
  - **통합 클라이언트:** callLLM 함수로 다중 프로바이더 지원
- **배포/호스팅:** Vercel, Netlify 등 서버리스 함수를 지원하는 플랫폼

## 7. 비기능 요구사항

- **성능:** 사용자의 요청 후 5초 이내에 결과가 표시되어야 한다. (단, 외부 LLM API의 응답 시간에 의존적)
- **보안:** LLM API 키는 클라이언트에 노출되지 않고 서버리스 함수 내에서만 사용되어야 한다.
- **LLM 가용성:**
  - **다중 프로바이더 지원:** 단일 프로바이더 장애에 대비한 자동 폴백 메커니즘
  - **API 키 검증:** 시스템 시작 시 모든 설정된 API 키의 유효성 확인
  - **에러 처리:** LLM API 장애 시 사용자 친화적 에러 메시지 제공
  - **토큰 최적화:** 난이도별 적절한 최대 토큰 수 설정으로 비용 효율성 확보
- **확장성:** 기능 추가 시, 새로운 페이지와 API Route를 추가하는 방식으로 수평적 확장이 용이하다.
- **TTS 호환성:**
  - Chrome, Safari, Firefox 등 주요 브라우저에서 Web Speech API를 지원해야 한다.
  - 브라우저가 TTS를 지원하지 않을 경우 적절한 안내 메시지를 표시한다.
  - 음성 재생 속도는 사용자가 이해하기 쉬운 자연스러운 속도로 설정한다.
- **접근성:** TTS 기능은 시각 장애인을 포함한 다양한 사용자의 접근성을 향상시킨다.
- **테스트 가능성:**
  - 테스트 환경에서는 Mock 응답을 사용하여 외부 API 의존성 없이 테스트 가능
  - TDD 방식으로 모든 핵심 기능에 대한 단위 테스트 및 통합 테스트 구현
