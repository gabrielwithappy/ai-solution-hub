/**
 * 영어 문장 생성 API Route
 * 환경변수 기반 동적 LLM 선택 구현
 */

import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm-client';
import { validateLLMConfig } from '@/lib/llm-config';

export interface GenerateSentenceRequest {
  text: string;
  level: '초급' | '중급' | '고급';
}

export interface GenerateSentenceResponse {
  sentences: string[];
  provider?: string;  // 어떤 LLM을 사용했는지 반환
}

export async function POST(request: NextRequest) {
  try {
    // 🔍 서버 시작 시 환경변수 검증
    const configValidation = validateLLMConfig();
    if (!configValidation.isValid) {
      console.error('❌ LLM 설정 오류:', configValidation.errors);
      return NextResponse.json(
        { error: 'LLM API 설정이 올바르지 않습니다.', details: configValidation.errors },
        { status: 500 }
      );
    }

    // ⚠️ 경고가 있으면 로그 출력
    if (configValidation.warnings.length > 0) {
      console.warn('⚠️ LLM 설정 경고:', configValidation.warnings);
    }

    // Request body 파싱 및 검증
    const body: GenerateSentenceRequest = await request.json();
    
    if (!body.text || body.text.length === 0) {
      return NextResponse.json(
        { error: '텍스트를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (body.text.length > 500) {
      return NextResponse.json(
        { error: '텍스트는 500자 이하로 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!['초급', '중급', '고급'].includes(body.level)) {
      return NextResponse.json(
        { error: '레벨은 초급, 중급, 고급 중 하나여야 합니다.' },
        { status: 400 }
      );
    }

    // 🤖 LLM 프롬프트 생성
    const prompt = `다음 텍스트를 기반으로 ${body.level} 수준의 영어 예문 3개를 만들어주세요.

텍스트: "${body.text}"

요구사항:
- ${body.level} 수준에 맞는 어휘와 문법 사용
- 자연스럽고 실용적인 문장
- 각 문장은 독립적이고 완전한 문장이어야 함

형식: 번호 없이 문장만 작성하고, 각 문장은 새 줄로 구분`;

    // 🔄 동적 LLM 호출 (primary + fallback 자동 처리)
    const llmResponse = await callLLM({
      prompt,
      maxTokens: 1000,
      temperature: 0.7
    });

    // 응답 파싱
    const sentences = llmResponse.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+\./)) // 번호 제거
      .slice(0, 3); // 최대 3개

    const response: GenerateSentenceResponse = {
      sentences,
      provider: llmResponse.provider  // 🏷️ 사용된 LLM provider 정보 포함
    };

    console.log(`✅ 영어 문장 생성 완료 - Provider: ${llmResponse.provider}, 문장 수: ${sentences.length}`);
    
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
