# 기술 명세서 (Technical Specification)

## 1. 기술 스택 개요

### 1.1. 핵심 기술

| 범주 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **프레임워크** | Next.js | 15.4.1 | 풀스택 React 프레임워크 |
| **언어** | TypeScript | 5.x | 타입 안전성 확보 |
| **테스트** | Jest | 29.x | 단위/통합 테스트 |
| **테스트** | React Testing Library | 16.x | 컴포넌트 테스트 |
| **린팅** | ESLint | 8.x | 코드 품질 관리 |
| **빌드 도구** | Turbopack | - | 빌드 성능 최적화 |

### 1.2. 외부 서비스

| 서비스 | 용도 | API 버전 |
|--------|------|----------|
| **OpenAI API** | GPT 모델 접근 | v1 |
| **Google Gemini API** | Gemini 모델 접근 | v1 |
| **Anthropic Claude API** | Claude 모델 접근 | v1 |
| **Web Speech API** | 브라우저 네이티브 TTS | - |

### 1.3. 인프라

| 구성요소 | 기술 | 용도 |
|----------|------|------|
| **호스팅** | Vercel/Netlify | 서버리스 배포 |
| **API Routes** | Next.js API Routes | 서버리스 함수 |
| **환경변수** | Vercel/Netlify 환경설정 | 시크릿 관리 |

## 2. 아키텍처 상세

### 2.1. 폴더 구조

```
webapp/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx             # 전역 레이아웃
│   │   ├── page.tsx               # 홈페이지
│   │   ├── globals.css            # 전역 스타일
│   │   ├── api/                   # API Routes
│   │   │   ├── generate-story/
│   │   │   │   ├── route.ts       # 스토리 생성 API
│   │   │   │   └── route.test.ts  # API 테스트
│   │   │   └── generate-sentence/
│   │   │       ├── route.ts       # 예문 생성 API
│   │   │       └── route.test.ts  # API 테스트
│   │   ├── english-story/
│   │   │   └── page.tsx           # 스토리 생성 페이지
│   │   └── english-sentence/
│   │       └── page.tsx           # 예문 생성 페이지
│   ├── components/                 # 재사용 컴포넌트
│   │   ├── ui/                    # 기본 UI 컴포넌트
│   │   ├── EnglishSentenceForm.tsx
│   │   ├── InputForm.tsx
│   │   ├── ResultDisplay.tsx
│   │   └── SentenceExampleCard.tsx
│   └── lib/                       # 비즈니스 로직
│       ├── english-story.ts       # 스토리 생성 로직
│       ├── english-story.types.ts # 타입 정의
│       ├── llm-client.ts          # LLM 통합 클라이언트
│       ├── llm-config.ts          # LLM 설정 관리
│       └── tts.ts                 # TTS 유틸리티
├── __tests__/                     # 테스트 파일
├── public/                        # 정적 자원
├── jest.config.ts                 # Jest 설정
├── jest.setup.ts                  # Jest 셋업
├── next.config.ts                 # Next.js 설정
├── tsconfig.json                  # TypeScript 설정
├── eslint.config.mjs             # ESLint 설정
└── package.json                   # 프로젝트 의존성
```

### 2.2. API 설계

#### 2.2.1. 영어 스토리 생성 API

```typescript
// POST /api/generate-story
interface StoryGenerationRequest {
    words: string[];                    // 1-5개 영어 단어
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface StoryGenerationResponse {
    englishStory: string;              // HTML 태그 포함 스토리
    koreanTranslation: string;         // 한국어 번역
    vocabulary: VocabularyItem[];      // 어휘 정보
    grammarPoints: string[];           // 문법 포인트
    estimatedReadingTime: number;      // 예상 읽기 시간(분)
    provider: string;                  // 사용된 LLM 프로바이더
}

interface VocabularyItem {
    word: string;                      // 단어
    meaning: string;                   // 의미
    pronunciation: string;             // 발음 기호
    partOfSpeech: string;             // 품사
    exampleSentence: string;          // 예문
}
```

#### 2.2.2. 영어 예문 생성 API

```typescript
// POST /api/generate-sentence
interface SentenceGenerationRequest {
    word: string;                      // 대상 영어 단어
}

interface SentenceGenerationResponse {
    word: string;                      // 입력 단어
    pronunciation: string;             // 발음 기호
    partOfSpeech: string;             // 품사
    definition: string;                // 정의
    examples: SentenceExample[];       // 예문 목록
    synonyms: string[];                // 유의어
    antonyms: string[];                // 반의어
    provider: string;                  // 사용된 LLM 프로바이더
}

interface SentenceExample {
    sentence: string;                  // 예문
    meaning: string;                   // 한국어 의미
    context: string;                   // 사용 상황
    grammarPoint?: string;             // 문법 포인트 (선택)
}
```

#### 2.2.3. 에러 응답

```typescript
interface ErrorResponse {
    error: string;                     // 에러 메시지
    code?: string;                     // 에러 코드 (선택)
    details?: Record<string, any>;     // 추가 정보 (선택)
}

// HTTP 상태 코드
// 200: 성공
// 400: 잘못된 요청 (입력 검증 실패)
// 500: 서버 내부 오류
// 503: 서비스 일시 불가 (LLM API 오류)
```

### 2.3. 환경변수 설정

#### 2.3.1. 필수 환경변수

```bash
# LLM 프로바이더 설정
LLM_PROVIDER=gemini                    # 기본 프로바이더 (gemini|openai|claude)

# API 키들 (적어도 하나는 필수)
OPENAI_API_KEY=sk-...                  # OpenAI API 키
GEMINI_API_KEY=...                     # Google Gemini API 키
CLAUDE_API_KEY=...                     # Anthropic Claude API 키

# 애플리케이션 설정
NODE_ENV=production                    # 환경 설정
NEXT_PUBLIC_APP_URL=https://...        # 앱 URL (선택)
```

#### 2.3.2. 환경변수 검증

```typescript
// src/lib/llm-config.ts
function validateEnvironmentVariables(): LLMValidationResult {
    const providers = ['openai', 'gemini', 'claude'];
    const apiKeys: Record<string, string> = {};
    const availableProviders: string[] = [];
    
    // API 키 수집 및 검증
    providers.forEach(provider => {
        const keyName = `${provider.toUpperCase()}_API_KEY`;
        const apiKey = process.env[keyName];
        
        if (apiKey && !isDummyKey(apiKey)) {
            apiKeys[provider] = apiKey;
            availableProviders.push(provider);
        }
    });
    
    // 최소 하나의 프로바이더 필요
    if (availableProviders.length === 0) {
        throw new Error('At least one valid LLM provider API key is required');
    }
    
    return {
        availableProviders,
        primaryProvider: process.env.LLM_PROVIDER || 'gemini',
        apiKeys
    };
}

function isDummyKey(key: string): boolean {
    const dummyPatterns = [
        'your_api_key',
        'dummy',
        'test',
        'placeholder',
        'sk-dummy',
        'gsk_dummy'
    ];
    
    return dummyPatterns.some(pattern => 
        key.toLowerCase().includes(pattern)
    );
}
```

## 3. LLM 통합 아키텍처

### 3.1. 통합 클라이언트 (`callLLM`)

```typescript
// src/lib/llm-client.ts
interface LLMRequest {
    prompt: string;
    maxTokens: number;
    temperature: number;
    model?: string;
}

interface LLMResponse {
    content: string;
    provider: string;
    usage?: TokenUsage;
    model?: string;
}

interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

async function callLLM(request: LLMRequest): Promise<LLMResponse> {
    const config = await validateLLMConfig();
    const primaryProvider = config.primaryProvider;
    
    // Primary provider 시도
    try {
        console.log(`Calling primary provider: ${primaryProvider}`);
        return await callProvider(primaryProvider, request);
    } catch (primaryError) {
        console.warn(`Primary provider ${primaryProvider} failed:`, primaryError);
        
        // Fallback providers 시도
        const fallbackProviders = config.availableProviders
            .filter(p => p !== primaryProvider);
            
        for (const provider of fallbackProviders) {
            try {
                console.log(`Trying fallback provider: ${provider}`);
                return await callProvider(provider, request);
            } catch (fallbackError) {
                console.warn(`Fallback provider ${provider} failed:`, fallbackError);
            }
        }
        
        // 모든 프로바이더 실패
        throw new Error('All LLM providers failed');
    }
}
```

### 3.2. 프로바이더별 구현

#### 3.2.1. OpenAI 구현

```typescript
async function callOpenAI(request: LLMRequest): Promise<LLMResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI API key not configured');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: request.model || 'gpt-4',
            messages: [
                {
                    role: 'user',
                    content: request.prompt
                }
            ],
            max_tokens: request.maxTokens,
            temperature: request.temperature,
        }),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
        content: data.choices[0].message.content,
        provider: 'openai',
        model: data.model,
        usage: data.usage
    };
}
```

#### 3.2.2. Google Gemini 구현

```typescript
async function callGemini(request: LLMRequest): Promise<LLMResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API key not configured');
    
    const model = request.model || 'gemini-pro';
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: request.prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                maxOutputTokens: request.maxTokens,
                temperature: request.temperature,
            },
        }),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid Gemini API response format');
    }
    
    return {
        content: data.candidates[0].content.parts[0].text,
        provider: 'gemini',
        model: model
    };
}
```

#### 3.2.3. Anthropic Claude 구현

```typescript
async function callClaude(request: LLMRequest): Promise<LLMResponse> {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) throw new Error('Claude API key not configured');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: request.model || 'claude-3-sonnet-20240229',
            max_tokens: request.maxTokens,
            temperature: request.temperature,
            messages: [
                {
                    role: 'user',
                    content: request.prompt
                }
            ],
        }),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
        content: data.content[0].text,
        provider: 'claude',
        model: data.model,
        usage: data.usage
    };
}
```

## 4. 프론트엔드 기술 상세

### 4.1. HTML 렌더링 구현

```typescript
// src/app/english-story/page.tsx
interface StoryDisplayProps {
    story: EnglishStoryResult;
}

function StoryDisplay({ story }: StoryDisplayProps) {
    // HTML 태그가 포함된 스토리를 안전하게 렌더링
    return (
        <div className="story-container">
            <div 
                className="story-content"
                dangerouslySetInnerHTML={{ 
                    __html: story.englishStory 
                }}
            />
            
            <div className="story-translation">
                <h3>한국어 번역:</h3>
                <p>{story.koreanTranslation}</p>
            </div>
        </div>
    );
}

// HTML 태그 제거 유틸리티
function stripHtmlTags(html: string): string {
    return html
        .replace(/<[^>]*>/g, '')           // HTML 태그 제거
        .replace(/&nbsp;/g, ' ')          // 비파괴 공백 처리
        .replace(/&amp;/g, '&')          // HTML 엔티티 처리
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
}
```

### 4.2. TTS 구현

```typescript
// src/lib/tts.ts
interface TTSOptions {
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
}

class TTSUtility {
    private synthesis: SpeechSynthesis | null = null;
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    
    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
        }
    }
    
    isSupported(): boolean {
        return this.synthesis !== null;
    }
    
    speak(text: string, options: TTSOptions = {}): void {
        if (!this.isSupported()) {
            throw new Error('TTS is not supported in this browser');
        }
        
        // 기존 재생 중지
        this.stop();
        
        // HTML 태그 제거
        const cleanText = stripHtmlTags(text);
        
        // SpeechSynthesisUtterance 생성
        this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
        
        // 옵션 설정
        this.currentUtterance.lang = options.lang || 'en-US';
        this.currentUtterance.rate = options.rate || 0.8;
        this.currentUtterance.pitch = options.pitch || 1.0;
        this.currentUtterance.volume = options.volume || 1.0;
        
        // 이벤트 핸들러
        this.currentUtterance.onstart = () => {
            console.log('TTS started');
        };
        
        this.currentUtterance.onend = () => {
            console.log('TTS completed');
            this.currentUtterance = null;
        };
        
        this.currentUtterance.onerror = (event) => {
            console.error('TTS error:', event.error);
            this.currentUtterance = null;
        };
        
        // 재생 시작
        this.synthesis!.speak(this.currentUtterance);
    }
    
    stop(): void {
        if (this.synthesis && this.currentUtterance) {
            this.synthesis.cancel();
            this.currentUtterance = null;
        }
    }
    
    pause(): void {
        if (this.synthesis) {
            this.synthesis.pause();
        }
    }
    
    resume(): void {
        if (this.synthesis) {
            this.synthesis.resume();
        }
    }
    
    isPlaying(): boolean {
        return this.synthesis?.speaking === true;
    }
}

// 싱글톤 인스턴스
export const ttsUtility = new TTSUtility();
```

### 4.3. 클립보드 API 구현

```typescript
// 클립보드 복사 함수
async function copyToClipboard(text: string): Promise<void> {
    // HTML 태그 제거
    const cleanText = stripHtmlTags(text);
    
    try {
        // 모던 브라우저의 Clipboard API 사용
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(cleanText);
            return;
        }
        
        // 레거시 브라우저 지원
        const textArea = document.createElement('textarea');
        textArea.value = cleanText;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        
        document.body.appendChild(textArea);
        textArea.select();
        textArea.setSelectionRange(0, 99999); // 모바일 지원
        
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        throw new Error('클립보드 복사에 실패했습니다.');
    }
}
```

## 5. 테스트 설정

### 5.1. Jest 설정

```typescript
// jest.config.ts
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
    dir: './',
});

const config: Config = {
    coverageProvider: 'v8',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapping: {
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
        '^@/app/(.*)$': '<rootDir>/src/app/$1',
    },
    testMatch: [
        '**/__tests__/**/*.(ts|tsx|js)',
        '**/*.(test|spec).(ts|tsx|js)',
    ],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.{ts,tsx}',
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
};

export default createJestConfig(config);
```

### 5.2. Jest 셋업

```typescript
// jest.setup.ts
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Node.js 환경에서 Web API polyfill
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Fetch API polyfill
import 'whatwg-fetch';

// 환경변수 설정
process.env.NODE_ENV = 'test';
process.env.LLM_PROVIDER = 'test-mock';

// speechSynthesis mock
Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    value: {
        speak: jest.fn(),
        cancel: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        speaking: false,
        pending: false,
        paused: false,
    },
});

// SpeechSynthesisUtterance mock
global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
    text,
    lang: 'en-US',
    rate: 1,
    pitch: 1,
    volume: 1,
    onstart: null,
    onend: null,
    onerror: null,
}));

// Navigator clipboard mock
Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: {
        writeText: jest.fn().mockResolvedValue(void 0),
        readText: jest.fn().mockResolvedValue(''),
    },
});

// console 경고 억제 (테스트 환경에서)
const originalWarn = console.warn;
console.warn = (...args) => {
    if (args[0]?.includes?.('dangerouslySetInnerHTML')) {
        return;
    }
    originalWarn(...args);
};
```

### 5.3. API 테스트 예제

```typescript
// src/app/api/generate-story/route.test.ts
import { POST } from './route';
import { NextRequest } from 'next/server';

// LLM 클라이언트 모킹
jest.mock('@/lib/llm-client', () => ({
    callLLM: jest.fn().mockResolvedValue({
        content: JSON.stringify({
            englishStory: 'A test <span style="color: #e74c3c; font-weight: bold;">story</span>',
            koreanTranslation: '테스트 스토리',
            vocabulary: [],
            grammarPoints: [],
            estimatedReadingTime: 1
        }),
        provider: 'test-mock'
    })
}));

describe('/api/generate-story', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    it('should generate story successfully with valid input', async () => {
        const requestBody = {
            words: ['adventure', 'forest'],
            difficulty: 'intermediate'
        };
        
        const request = new NextRequest(
            'http://localhost:3000/api/generate-story',
            {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        
        const response = await POST(request);
        const result = await response.json();
        
        expect(response.status).toBe(200);
        expect(result.englishStory).toBeDefined();
        expect(result.koreanTranslation).toBeDefined();
        expect(result.provider).toBe('test-mock');
    });
    
    it('should return 400 for invalid input', async () => {
        const requestBody = {
            words: [], // 빈 배열
            difficulty: 'invalid'
        };
        
        const request = new NextRequest(
            'http://localhost:3000/api/generate-story',
            {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        
        const response = await POST(request);
        
        expect(response.status).toBe(400);
    });
});
```

## 6. 성능 최적화

### 6.1. Next.js 최적화

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // Turbopack 사용 (개발 환경)
    experimental: {
        turbo: {},
    },
    
    // 이미지 최적화
    images: {
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    },
    
    // 압축 활성화
    compress: true,
    
    // 트레일링 슬래시 제거
    trailingSlash: false,
    
    // 정적 최적화
    output: 'standalone',
    
    // 환경변수
    env: {
        CUSTOM_KEY: process.env.CUSTOM_KEY,
    },
    
    // 헤더 설정
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
```

### 6.2. 컴포넌트 최적화

```typescript
// React.memo 사용
const MemoizedStoryDisplay = React.memo(({ story }: { story: EnglishStoryResult }) => {
    return (
        <div dangerouslySetInnerHTML={{ __html: story.englishStory }} />
    );
});

// useMemo를 통한 계산 결과 캐싱
function useProcessedStory(story: EnglishStoryResult | null) {
    return useMemo(() => {
        if (!story) return null;
        
        return {
            ...story,
            cleanText: stripHtmlTags(story.englishStory),
            wordCount: story.englishStory.split(' ').length,
        };
    }, [story]);
}

// useCallback을 통한 함수 메모이제이션
function useStoryActions(story: EnglishStoryResult | null) {
    const handleTTS = useCallback(() => {
        if (story?.englishStory) {
            const cleanText = stripHtmlTags(story.englishStory);
            ttsUtility.speak(cleanText);
        }
    }, [story?.englishStory]);
    
    const handleCopy = useCallback(async () => {
        if (story?.englishStory) {
            try {
                await copyToClipboard(story.englishStory);
                alert('클립보드에 복사되었습니다.');
            } catch (error) {
                alert('복사에 실패했습니다.');
            }
        }
    }, [story?.englishStory]);
    
    return { handleTTS, handleCopy };
}
```

## 7. 보안 구현

### 7.1. 입력 검증

```typescript
// src/lib/validation.ts
import { z } from 'zod';

const StoryGenerationSchema = z.object({
    words: z.array(z.string().min(1).max(50)).min(1).max(5),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
});

const SentenceGenerationSchema = z.object({
    word: z.string().min(1).max(50),
});

export function validateStoryRequest(data: unknown): StoryGenerationRequest {
    try {
        return StoryGenerationSchema.parse(data);
    } catch (error) {
        throw new ValidationError('Invalid story generation request', error);
    }
}

export function validateSentenceRequest(data: unknown): SentenceGenerationRequest {
    try {
        return SentenceGenerationSchema.parse(data);
    } catch (error) {
        throw new ValidationError('Invalid sentence generation request', error);
    }
}

// XSS 방지를 위한 추가 검증
export function sanitizeInput(input: string): string {
    return input
        .replace(/[<>]/g, '')           // HTML 태그 제거
        .replace(/javascript:/gi, '')   // JavaScript URL 제거
        .replace(/on\w+=/gi, '')        // 이벤트 핸들러 제거
        .trim();
}
```

### 7.2. 환경변수 보안

```typescript
// src/lib/security.ts
export function getSecureConfig(): SecureConfig {
    const config = {
        llmProvider: process.env.LLM_PROVIDER || 'gemini',
        apiKeys: {
            openai: process.env.OPENAI_API_KEY,
            gemini: process.env.GEMINI_API_KEY,
            claude: process.env.CLAUDE_API_KEY,
        },
        nodeEnv: process.env.NODE_ENV || 'development',
    };
    
    // 프로덕션에서 민감 정보 로깅 방지
    if (config.nodeEnv === 'production') {
        console.log('Config loaded (keys masked for security)');
    } else {
        console.log('Config loaded:', {
            ...config,
            apiKeys: Object.keys(config.apiKeys),
        });
    }
    
    return config;
}

// API 키 마스킹
export function maskApiKey(key: string): string {
    if (!key || key.length < 8) return '***';
    return key.substring(0, 4) + '***' + key.substring(key.length - 4);
}
```

## 8. 배포 설정

### 8.1. Vercel 설정

```json
// vercel.json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "LLM_PROVIDER": "@llm_provider",
      "OPENAI_API_KEY": "@openai_api_key",
      "GEMINI_API_KEY": "@gemini_api_key",
      "CLAUDE_API_KEY": "@claude_api_key"
    }
  }
}
```

### 8.2. 빌드 스크립트

```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf .next out dist",
    "analyze": "ANALYZE=true npm run build"
  }
}
```

이 기술 명세서는 시스템의 모든 기술적 구현 세부사항을 포괄하며, 개발자가 시스템을 이해하고 확장할 수 있도록 충분한 정보를 제공한다.
