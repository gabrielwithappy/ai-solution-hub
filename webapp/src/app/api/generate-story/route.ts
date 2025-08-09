import { NextRequest, NextResponse } from 'next/server';
import { generateEnglishStory, validateWordMeanings } from '@/lib/english-story';
import { WordMeaning, StoryDifficulty, StoryGenerationError } from '@/lib/english-story.types';

export async function POST(request: NextRequest) {
    try {
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

        // 스토리 생성
        const result = await generateEnglishStory(validWords, difficulty);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Story generation error:', error);

        if (error instanceof StoryGenerationError) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: '스토리 생성 중 오류가 발생했습니다. 다시 시도해 주세요.' },
            { status: 500 }
        );
    }
}
