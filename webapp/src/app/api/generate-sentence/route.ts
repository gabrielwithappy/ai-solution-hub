/**
 * 영어 문장 생성 API Route
 * 환경변수 기반 동적 LLM 선택 구현
 */

import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm-client';
import { validateLLMConfig } from '@/lib/llm-config';

/**
 * 문장의 단어 순서를 섞는 함수
 */
function scrambleSentence(sentence: string): string {
  const words = sentence.split(/(\s+|[.,!?;:])/); // 구두점 보존하며 분리
  const wordIndices: number[] = [];

  // 실제 단어(구두점이 아닌)의 인덱스만 수집
  words.forEach((word, index) => {
    if (word.trim() && !word.match(/^[.,!?;:\s]+$/)) {
      wordIndices.push(index);
    }
  });

  // 단어 인덱스를 섞기
  const shuffledIndices = [...wordIndices];
  for (let i = shuffledIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
  }

  // 섞인 순서로 단어 재배치
  const result = [...words];
  wordIndices.forEach((originalIndex, i) => {
    result[originalIndex] = words[shuffledIndices[i]];
  });

  return result.join('');
}

/**
 * LLM 응답을 파싱하여 예시 문장들을 추출
 */
function parseExamples(content: string): Omit<SentenceExample, 'scrambledSentence'>[] {
  const examples: Omit<SentenceExample, 'scrambledSentence'>[] = [];
  const sections = content.split(/의미\d+:/);

  sections.forEach(section => {
    if (!section.trim()) return;

    const lines = section.trim().split('\n').filter(line => line.trim());
    if (lines.length >= 3) {
      const meaning = lines[0].trim();
      const originalSentence = lines[1].trim();
      const koreanTranslation = lines[2].trim();

      examples.push({
        meaning,
        originalSentence,
        koreanTranslation
      });
    }
  });

  return examples;
}

export interface GenerateSentenceRequest {
  word: string;
  level: '초급' | '중급' | '고급';
}

export interface SentenceExample {
  meaning: string;           // 단어의 의미/뜻
  originalSentence: string;  // 완성된 영어 문장
  scrambledSentence: string; // 단어 순서가 섞인 문장
  koreanTranslation: string; // 한국어 해석
}

export interface GenerateSentenceResponse {
  examples: SentenceExample[];
  provider?: string;  // 어떤 LLM을 사용했는지 반환
}

export async function POST(request: NextRequest) {
  try {
    // 🔍 서버 시작 시 환경변수 검증
    const configValidation = validateLLMConfig();
    if (!configValidation.isValid) {
      console.error('❌ LLM 설정 오류:', configValidation.errors);
      return NextResponse.json(
        { error: 'AI 서비스 설정에 문제가 있습니다. 환경 변수를 확인해주세요.', details: configValidation.errors },
        { status: 500 }
      );
    }

    // 사용 가능한 프로바이더 정보 출력 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      const availableProviders = getAvailableProviders();
      const primaryProvider = getPrimaryProvider();
      console.log(`🔧 LLM 설정 - 사용 가능: [${availableProviders.join(', ')}], 기본: ${primaryProvider}`);

      if (configValidation.warnings.length > 0) {
        console.warn('⚠️ 설정 참고사항:', configValidation.warnings);
      }
    }

    // Request body 파싱 및 검증
    const body: GenerateSentenceRequest = await request.json();

    if (!body.word || body.word.length === 0) {
      return NextResponse.json(
        { error: '영어 단어를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (body.word.length > 50) {
      return NextResponse.json(
        { error: '단어는 50자 이하로 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!['초급', '중급', '고급'].includes(body.level)) {
      return NextResponse.json(
        { error: '레벨은 초급, 중급, 고급 중 하나여야 합니다.' },
        { status: 400 }
      );
    }

    // 🤖 다의어 처리를 위한 새로운 프롬프트
    const prompt = `다음 영어 단어 "${body.word}"의 서로 다른 의미들을 찾아서, 각 의미마다 ${body.level} 수준의 영어 예문과 한국어 해석을 제공해주세요.

단어: "${body.word}"
난이도: ${body.level}

요구사항:
- 단어가 가진 주요 의미들을 모두 포함 (최대 5개)
- 각 의미마다 자연스럽고 실용적인 예문 1개씩
- ${body.level} 수준에 맞는 어휘와 문법 사용
- 한국어 해석은 자연스럽고 정확하게
- 추가 설명이나 제목, prefix 없이 깔끔하게 제공

출력 형식 예시:
의미1: 시험, 검사
I have a math test tomorrow.
나는 내일 수학 시험이 있다.

의미2: 시도하다, 테스트하다
We need to test this new feature.
우리는 이 새로운 기능을 테스트해야 한다.

위 예시와 동일한 형식으로 출력하되, "[영어 예문]", "예문:", "English:" 등의 prefix는 절대 사용하지 마세요.`;

    // 🔄 동적 LLM 호출 (primary + fallback 자동 처리)
    const llmResponse = await callLLM({
      prompt,
      maxTokens: 1500,
      temperature: 0.7
    });

    // 응답 파싱 및 scrambled 문장 생성
    const parsedExamples = parseExamples(llmResponse.content);
    const examples: SentenceExample[] = parsedExamples.map(example => ({
      ...example,
      scrambledSentence: scrambleSentence(example.originalSentence)
    }));

    const response: GenerateSentenceResponse = {
      examples,
      provider: llmResponse.provider  // 🏷️ 사용된 LLM provider 정보 포함
    };

    console.log(`✅ 영어 문장 생성 완료 - Provider: ${llmResponse.provider}, 예시 수: ${examples.length}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ 영어 문장 생성 API 오류:', error);

    // LLM API 연결 실패 시 사용자 친화적 메시지
    if (error instanceof Error && error.message.includes('API')) {
      return NextResponse.json(
        {
          error: 'AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
