import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm-client';
import { validateLLMConfig, getAvailableProviders, getPrimaryProvider } from '@/lib/llm-config';
import { generateEnglishStory, validateWordMeanings, generatePrompt, parseApiResponse, getMaxTokensForDifficulty } from '@/lib/english-story';
import { WordMeaning, StoryDifficulty, StoryGenerationError, StoryResult } from '@/lib/english-story.types';

export async function POST(request: NextRequest) {
    try {
        // LLM 설정 유효성 검사
        const configValidation = validateLLMConfig();

        if (!configValidation.isValid) {
            console.error('❌ LLM 설정 검증 실패:', configValidation.errors);
            return NextResponse.json(
                {
                    error: 'AI 서비스 설정에 문제가 있습니다. 환경 변수를 확인해주세요.',
                    details: process.env.NODE_ENV === 'development' ? configValidation.errors : undefined
                },
                { status: 503 }
            );
        }

        // 개발 환경에서 설정 정보 출력
        if (process.env.NODE_ENV === 'development') {
            const availableProviders = getAvailableProviders();
            const primaryProvider = getPrimaryProvider();
            console.log(`🔧 Story API - 사용 가능한 프로바이더: [${availableProviders.join(', ')}], 기본: ${primaryProvider}`);

            if (configValidation.warnings.length > 0) {
                console.warn('⚠️ 설정 참고사항:', configValidation.warnings);
            }
        }

        // Request body 파싱 및 검증
        const body = await request.json();
        const { words, difficulty }: { words: WordMeaning[], difficulty: StoryDifficulty } = body;

        // 입력값 검증
        if (!words || !Array.isArray(words)) {
            return NextResponse.json(
                { error: '단어 배열이 필요합니다.' },
                { status: 400 }
            );
        }

        if (!difficulty) {
            return NextResponse.json(
                { error: '난이도가 필요합니다.' },
                { status: 400 }
            );
        }

        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            return NextResponse.json(
                { error: '난이도는 easy, medium, hard 중 하나여야 합니다.' },
                { status: 400 }
            );
        }

        // 빈 단어 필터링
        const validWords = words.filter(word =>
            word.englishWord?.trim() && word.koreanMeaning?.trim()
        );

        if (validWords.length === 0) {
            return NextResponse.json(
                { error: '최소 1개 이상의 유효한 단어를 입력해야 합니다.' },
                { status: 400 }
            );
        }

        // 단어 유효성 검증
        validateWordMeanings(validWords);

        let result: StoryResult;

        // 테스트 환경에서는 기존 generateEnglishStory 사용 (mock 지원)
        if (process.env.NODE_ENV === 'test') {
            const storyResponse = await generateEnglishStory(validWords, difficulty);
            result = {
                ...storyResponse,
                provider: 'test-mock'
            };
        } else {
            // 프로덕션 환경에서는 직접 LLM API 호출
            const prompt = generatePrompt(validWords, difficulty);

            // LLM API 호출 (primary + fallback 자동 처리)
            const llmResponse = await callLLM({
                prompt,
                maxTokens: getMaxTokensForDifficulty(difficulty),
                temperature: 0.7
            });

            // 응답 파싱
            const storyResponse = parseApiResponse(llmResponse.content, validWords, difficulty);

            result = {
                ...storyResponse,
                provider: llmResponse.provider  // 사용된 LLM provider 정보 포함
            };
        }

        console.log(`✅ 영어 스토리 생성 완료 - Provider: ${result.provider}, 단어 수: ${validWords.length}`);

        return NextResponse.json(result);

    } catch (error) {
        console.error('❌ 영어 스토리 생성 API 오류:', error);

        if (error instanceof StoryGenerationError) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

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
            { error: '스토리 생성 중 오류가 발생했습니다. 다시 시도해 주세요.' },
            { status: 500 }
        );
    }
}
