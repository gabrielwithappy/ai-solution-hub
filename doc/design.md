# 설계 문서 (Design Document)

## 1. 개요

본 문서는 AI 기반 영어 학습 웹 애플리케이션의 상세 설계를 다룬다. 사용자가 영어 단어를 입력하면 LLM을 활용하여 교육적 콘텐츠(스토리, 예문)를 생성하고, HTML 태그를 통한 시각적 강조와 TTS 기능을 제공하는 시스템이다.

## 2. 시스템 아키텍처

### 2.1. 전체 아키텍처

```
┌─────────────────────────────────────────────┐
│                User/Browser                 │
│  ┌─────────────────────────────────────┐    │
│  │        React Frontend              │    │
│  │   - English Story Page             │    │
│  │   - English Sentence Page          │    │
│  │   - HTML Rendering                 │    │
│  │   - TTS Integration                │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │      Web Speech API                │    │
│  │   (Browser Native TTS)             │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│             Next.js Application             │
│  ┌─────────────────────────────────────┐    │
│  │        API Routes                  │    │
│  │   - /api/generate-story            │    │
│  │   - /api/generate-sentence         │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │       LLM Integration Layer        │    │
│  │   - callLLM (Unified Client)      │    │
│  │   - Multi-provider Support        │    │
│  │   - Auto Fallback                 │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│            External LLM APIs               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │ OpenAI  │  │ Gemini  │  │ Claude  │     │
│  │   API   │  │   API   │  │   API   │     │
│  └─────────┘  └─────────┘  └─────────┘     │
└─────────────────────────────────────────────┘
```

### 2.2. 주요 설계 원칙

1. **관심사 분리**: 프론트엔드(UI), API Layer(비즈니스 로직), LLM Integration(외부 서비스)
2. **확장성**: 새로운 LLM 프로바이더 추가 용이
3. **가용성**: 다중 프로바이더 지원으로 단일 장애점 제거
4. **보안**: API 키 서버 측 관리, 클라이언트 노출 방지
5. **테스트 용이성**: Mock 기반 테스트 환경 지원

## 3. 컴포넌트 설계

### 3.1. 프론트엔드 컴포넌트

#### 3.1.1. 페이지 컴포넌트

```typescript
// src/app/english-story/page.tsx
interface EnglishStoryPageProps {}

interface StoryFormData {
    words: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface StoryResult {
    englishStory: string;
    koreanTranslation: string;
    vocabulary: VocabularyItem[];
    provider: string;
}
```

**주요 기능:**
- 사용자 입력 폼 관리
- API 호출 및 상태 관리
- HTML 콘텐츠 렌더링 (`dangerouslySetInnerHTML`)
- TTS 기능 통합
- 클립보드 복사 기능

#### 3.1.2. 유틸리티 함수

```typescript
// HTML 태그 제거 함수
function stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}

// TTS 재생 함수
function playTTS(text: string): void {
    const cleanText = stripHtmlTags(text);
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    }
}
```

### 3.2. API Layer 설계

#### 3.2.1. API 엔드포인트 구조

```typescript
// src/app/api/generate-story/route.ts
export async function POST(request: Request) {
    try {
        // 1. 입력 검증
        const { words, difficulty } = await request.json();
        validateInput(words, difficulty);
        
        // 2. LLM 설정 확인
        const config = await validateLLMConfig();
        
        // 3. 프롬프트 생성
        const prompt = generatePrompt(words, difficulty);
        
        // 4. LLM API 호출 (통합 클라이언트)
        const llmResponse = await callLLM({
            prompt,
            maxTokens: getMaxTokensForDifficulty(difficulty),
            temperature: 0.7
        });
        
        // 5. 응답 파싱 및 반환
        const result = parseApiResponse(llmResponse.content, words, difficulty);
        return NextResponse.json({
            ...result,
            provider: llmResponse.provider
        });
        
    } catch (error) {
        return handleApiError(error);
    }
}
```

#### 3.2.2. 에러 처리 전략

```typescript
function handleApiError(error: unknown): NextResponse {
    if (error instanceof ValidationError) {
        return NextResponse.json(
            { error: error.message },
            { status: 400 }
        );
    }
    
    if (error instanceof LLMError) {
        return NextResponse.json(
            { error: 'AI 서비스에 일시적인 문제가 발생했습니다.' },
            { status: 503 }
        );
    }
    
    console.error('Unexpected error:', error);
    return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
    );
}
```

### 3.3. LLM 통합 계층

#### 3.3.1. 통합 클라이언트 설계

```typescript
// src/lib/llm-client.ts
interface LLMRequest {
    prompt: string;
    maxTokens: number;
    temperature: number;
}

interface LLMResponse {
    content: string;
    provider: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

async function callLLM(request: LLMRequest): Promise<LLMResponse> {
    const providers = getAvailableProviders();
    const primaryProvider = process.env.LLM_PROVIDER || 'gemini';
    
    // Primary provider 시도
    try {
        return await callProvider(primaryProvider, request);
    } catch (error) {
        console.warn(`Primary provider ${primaryProvider} failed:`, error);
        
        // Fallback providers 시도
        for (const provider of providers.filter(p => p !== primaryProvider)) {
            try {
                console.log(`Trying fallback provider: ${provider}`);
                return await callProvider(provider, request);
            } catch (fallbackError) {
                console.warn(`Fallback provider ${provider} failed:`, fallbackError);
            }
        }
        
        throw new Error('All LLM providers failed');
    }
}
```

#### 3.3.2. 프로바이더별 구현

```typescript
// OpenAI 프로바이더
async function callOpenAI(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: request.prompt }],
            max_tokens: request.maxTokens,
            temperature: request.temperature,
        }),
    });
    
    const data = await response.json();
    return {
        content: data.choices[0].message.content,
        provider: 'openai',
        usage: data.usage
    };
}

// Gemini 프로바이더
async function callGemini(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: request.prompt }] }],
            generationConfig: {
                maxOutputTokens: request.maxTokens,
                temperature: request.temperature,
            },
        }),
    });
    
    const data = await response.json();
    return {
        content: data.candidates[0].content.parts[0].text,
        provider: 'gemini'
    };
}
```

## 4. 데이터 모델

### 4.1. 타입 정의

```typescript
// src/lib/english-story.types.ts
export interface VocabularyItem {
    word: string;
    meaning: string;
    pronunciation: string;
    partOfSpeech: string;
    exampleSentence: string;
}

export interface EnglishStoryResult {
    englishStory: string;
    koreanTranslation: string;
    vocabulary: VocabularyItem[];
    grammarPoints: string[];
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    estimatedReadingTime: number;
    provider?: string;
}

export interface SentenceExample {
    sentence: string;
    meaning: string;
    context: string;
    grammarPoint?: string;
}

export interface EnglishSentenceResult {
    word: string;
    pronunciation: string;
    partOfSpeech: string;
    definition: string;
    examples: SentenceExample[];
    synonyms: string[];
    antonyms: string[];
    provider?: string;
}
```

### 4.2. 설정 모델

```typescript
// src/lib/llm-config.ts
export interface LLMConfig {
    provider: string;
    apiKey: string;
    model: string;
    maxRetries: number;
    timeout: number;
}

export interface ProviderConfig {
    openai: {
        apiKey: string;
        models: string[];
        endpoint: string;
    };
    gemini: {
        apiKey: string;
        models: string[];
        endpoint: string;
    };
    claude: {
        apiKey: string;
        models: string[];
        endpoint: string;
    };
}
```

## 5. 비즈니스 로직

### 5.1. 프롬프트 엔지니어링

#### 5.1.1. 스토리 생성 프롬프트

```typescript
function generatePrompt(words: string[], difficulty: Difficulty): string {
    const difficultyGuidelines = {
        beginner: {
            vocabulary: '초급 수준의 쉬운 단어',
            grammar: '현재형, 과거형 위주의 간단한 문법',
            length: '50-100단어',
            complexity: '단순한 문장 구조'
        },
        intermediate: {
            vocabulary: '중급 수준의 일반적인 단어',
            grammar: '다양한 시제와 문법 구조',
            length: '100-150단어',
            complexity: '복합문 포함'
        },
        advanced: {
            vocabulary: '고급 수준의 복잡한 단어',
            grammar: '고급 문법과 관용구',
            length: '150-200단어',
            complexity: '복잡한 문장 구조와 수사법'
        }
    };
    
    const guidelines = difficultyGuidelines[difficulty];
    
    return `
당신은 영어 교육 전문가입니다. 다음 단어들을 모두 포함하는 흥미로운 영어 스토리를 작성해주세요.

**입력 단어**: ${words.join(', ')}
**난이도**: ${difficulty} (${guidelines.vocabulary}, ${guidelines.grammar})
**스토리 길이**: ${guidelines.length}

**HTML 태그 사용 지침**:
- 입력된 키워드는 <span style="color: #e74c3c; font-weight: bold;">키워드</span>로 강조
- 어려운 단어는 <span style="color: #3498db; font-weight: bold;">어려운단어</span>로 강조

**응답 형식** (JSON):
{
  "englishStory": "HTML 태그가 포함된 영어 스토리",
  "koreanTranslation": "한국어 번역",
  "vocabulary": [
    {
      "word": "단어",
      "meaning": "의미",
      "pronunciation": "발음",
      "partOfSpeech": "품사",
      "exampleSentence": "예문"
    }
  ],
  "grammarPoints": ["문법 포인트들"],
  "estimatedReadingTime": 분
}
`;
}
```

#### 5.1.2. 예문 생성 프롬프트

```typescript
function generateSentencePrompt(word: string): string {
    return `
당신은 영어 교육 전문가입니다. 주어진 영어 단어에 대한 포괄적인 학습 자료를 만들어주세요.

**대상 단어**: ${word}

**요구사항**:
1. 다양한 상황에서의 실용적인 예문 생성
2. 일상생활에서 활용 가능한 문장
3. 다양한 문형 (평서문, 의문문, 감탄문 등)
4. 문법적으로 정확한 문장

**응답 형식** (JSON):
{
  "word": "${word}",
  "pronunciation": "발음 기호",
  "partOfSpeech": "품사",
  "definition": "정의",
  "examples": [
    {
      "sentence": "예문",
      "meaning": "한국어 의미",
      "context": "사용 상황",
      "grammarPoint": "문법 포인트 (선택사항)"
    }
  ],
  "synonyms": ["유의어들"],
  "antonyms": ["반의어들"]
}
`;
}
```

### 5.2. 응답 파싱 로직

```typescript
function parseApiResponse(content: string, words: string[], difficulty: Difficulty): EnglishStoryResult {
    try {
        const parsed = JSON.parse(content);
        
        // 기본 검증
        if (!parsed.englishStory || !parsed.koreanTranslation) {
            throw new Error('Required fields missing in LLM response');
        }
        
        // 입력 단어 포함 여부 검증
        const storyLower = parsed.englishStory.toLowerCase();
        const missingWords = words.filter(word => 
            !storyLower.includes(word.toLowerCase())
        );
        
        if (missingWords.length > 0) {
            console.warn('Missing words in story:', missingWords);
        }
        
        return {
            englishStory: parsed.englishStory,
            koreanTranslation: parsed.koreanTranslation,
            vocabulary: parsed.vocabulary || [],
            grammarPoints: parsed.grammarPoints || [],
            difficultyLevel: difficulty,
            estimatedReadingTime: parsed.estimatedReadingTime || estimateReadingTime(parsed.englishStory)
        };
        
    } catch (error) {
        console.error('Failed to parse LLM response:', error);
        throw new Error('Invalid response format from LLM');
    }
}
```

## 6. 보안 설계

### 6.1. API 키 관리

```typescript
// 환경변수 검증
function validateEnvironmentVariables(): void {
    const requiredVars = ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'CLAUDE_API_KEY'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.warn('Missing environment variables:', missingVars);
    }
    
    // 더미 값 필터링
    const dummyPatterns = ['your_api_key', 'dummy', 'test', 'placeholder'];
    requiredVars.forEach(varName => {
        const value = process.env[varName];
        if (value && dummyPatterns.some(pattern => value.includes(pattern))) {
            console.warn(`Dummy value detected for ${varName}`);
            delete process.env[varName];
        }
    });
}
```

### 6.2. 입력 검증

```typescript
function validateInput(words: string[], difficulty: string): void {
    // 단어 개수 검증
    if (!words || words.length === 0 || words.length > 5) {
        throw new ValidationError('단어는 1-5개 사이여야 합니다.');
    }
    
    // 단어 형식 검증
    const validWordPattern = /^[a-zA-Z\s-']+$/;
    const invalidWords = words.filter(word => !validWordPattern.test(word));
    if (invalidWords.length > 0) {
        throw new ValidationError(`유효하지 않은 단어: ${invalidWords.join(', ')}`);
    }
    
    // 난이도 검증
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(difficulty)) {
        throw new ValidationError('유효하지 않은 난이도입니다.');
    }
    
    // XSS 방지를 위한 추가 검증
    words.forEach(word => {
        if (word.includes('<') || word.includes('>')) {
            throw new ValidationError('HTML 태그는 허용되지 않습니다.');
        }
    });
}
```

## 7. 성능 최적화

### 7.1. 응답 시간 최적화

```typescript
// 토큰 수 최적화
function getMaxTokensForDifficulty(difficulty: Difficulty): number {
    const tokenLimits = {
        beginner: 800,
        intermediate: 1200,
        advanced: 1600
    };
    return tokenLimits[difficulty];
}

// 프롬프트 길이 최적화
function optimizePrompt(prompt: string): string {
    // 불필요한 공백 제거
    prompt = prompt.replace(/\s+/g, ' ').trim();
    
    // 중복 지시사항 제거
    // ... 최적화 로직
    
    return prompt;
}
```

### 7.2. 클라이언트 최적화

```typescript
// 디바운싱을 통한 API 호출 최적화
const debouncedApiCall = debounce(async (formData: StoryFormData) => {
    setLoading(true);
    try {
        const response = await fetch('/api/generate-story', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        setStory(result);
    } catch (error) {
        setError(error.message);
    } finally {
        setLoading(false);
    }
}, 500);

// 메모이제이션을 통한 리렌더링 최적화
const MemoizedStoryDisplay = React.memo(({ story }: { story: EnglishStoryResult }) => {
    return (
        <div dangerouslySetInnerHTML={{ __html: story.englishStory }} />
    );
});
```

## 8. 테스트 전략

### 8.1. 단위 테스트

```typescript
// src/lib/english-story.test.ts
describe('generatePrompt', () => {
    it('should include all input words in prompt', () => {
        const words = ['adventure', 'forest'];
        const difficulty = 'intermediate';
        const prompt = generatePrompt(words, difficulty);
        
        words.forEach(word => {
            expect(prompt).toContain(word);
        });
    });
    
    it('should adjust complexity based on difficulty', () => {
        const words = ['test'];
        
        const beginnerPrompt = generatePrompt(words, 'beginner');
        const advancedPrompt = generatePrompt(words, 'advanced');
        
        expect(beginnerPrompt).toContain('초급 수준');
        expect(advancedPrompt).toContain('고급 수준');
    });
});
```

### 8.2. 통합 테스트

```typescript
// src/app/api/generate-story/route.test.ts
describe('/api/generate-story', () => {
    beforeEach(() => {
        process.env.NODE_ENV = 'test';
    });
    
    it('should generate story successfully', async () => {
        const requestBody = {
            words: ['adventure', 'forest'],
            difficulty: 'intermediate'
        };
        
        const response = await POST(new Request('http://localhost', {
            method: 'POST',
            body: JSON.stringify(requestBody)
        }));
        
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.englishStory).toBeDefined();
        expect(result.koreanTranslation).toBeDefined();
    });
});
```

### 8.3. E2E 테스트 시나리오

```typescript
// 전체 사용자 플로우 테스트
describe('English Story Generation E2E', () => {
    it('should complete full story generation flow', async () => {
        // 1. 페이지 로드
        await page.goto('/english-story');
        
        // 2. 단어 입력
        await page.fill('[data-testid="word-input"]', 'adventure, forest');
        
        // 3. 난이도 선택
        await page.selectOption('[data-testid="difficulty-select"]', 'intermediate');
        
        // 4. 생성 버튼 클릭
        await page.click('[data-testid="generate-button"]');
        
        // 5. 결과 확인
        await page.waitForSelector('[data-testid="story-result"]');
        const storyText = await page.textContent('[data-testid="story-result"]');
        expect(storyText).toContain('adventure');
        expect(storyText).toContain('forest');
        
        // 6. TTS 기능 테스트
        await page.click('[data-testid="tts-button"]');
        // TTS 실행 여부는 브라우저 환경에 따라 다르므로 버튼 상태 변화로 확인
    });
});
```

## 9. 모니터링 및 로깅

### 9.1. 로깅 전략

```typescript
// src/lib/logger.ts
interface LogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    metadata?: Record<string, any>;
}

function log(level: LogEntry['level'], message: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        metadata
    };
    
    // 프로덕션에서는 외부 로깅 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
        // Send to logging service
        console.log(JSON.stringify(entry));
    } else {
        console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, metadata);
    }
}

// LLM API 호출 로깅
function logLLMCall(provider: string, tokens: number, responseTime: number): void {
    log('info', 'LLM API call completed', {
        provider,
        tokens,
        responseTime,
        cost: calculateCost(provider, tokens)
    });
}
```

### 9.2. 성능 모니터링

```typescript
// API 응답 시간 측정
async function measureApiPerformance<T>(
    operation: () => Promise<T>,
    operationName: string
): Promise<T> {
    const startTime = performance.now();
    
    try {
        const result = await operation();
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        log('info', `${operationName} completed`, {
            duration: `${duration.toFixed(2)}ms`,
            success: true
        });
        
        return result;
    } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        log('error', `${operationName} failed`, {
            duration: `${duration.toFixed(2)}ms`,
            error: error.message,
            success: false
        });
        
        throw error;
    }
}
```

## 10. 배포 및 운영

### 10.1. 환경 설정

```bash
# .env.local (개발환경)
NODE_ENV=development
LLM_PROVIDER=gemini
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
CLAUDE_API_KEY=your_claude_key

# .env.production (프로덕션)
NODE_ENV=production
LLM_PROVIDER=gemini
OPENAI_API_KEY=${OPENAI_API_KEY}
GEMINI_API_KEY=${GEMINI_API_KEY}
CLAUDE_API_KEY=${CLAUDE_API_KEY}
```

### 10.2. CI/CD 파이프라인

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

이 설계 문서는 시스템의 모든 주요 구성 요소와 상호작용을 상세히 다루며, 확장성과 유지보수성을 고려한 아키텍처를 제시한다.
