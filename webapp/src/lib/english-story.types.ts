// 영어 단어 기반 스토리 생성 기능을 위한 타입 정의

/**
 * 영어 단어와 한국어 의미 쌍
 */
export interface WordMeaning {
    englishWord: string;
    koreanMeaning: string;
}

/**
 * 스토리 난이도 레벨
 */
export type StoryDifficulty = 'easy' | 'medium' | 'hard';

/**
 * 스토리 생성 응답 타입
 */
export interface StoryResponse {
    englishStory: string;
    koreanTranslation: string;
    usedWords: WordMeaning[];
    difficulty: StoryDifficulty;
}

/**
 * LLM API 호출 결과를 포함한 스토리 응답 타입
 */
export interface StoryResult extends StoryResponse {
    provider: string;
}

/**
 * API 요청 타입
 */
export interface StoryGenerationRequest {
    words: WordMeaning[];
    difficulty: StoryDifficulty;
    maxLength?: number;
}

/**
 * 에러 타입 정의
 */
export class StoryGenerationError extends Error {
    constructor(message: string, public code?: string) {
        super(message);
        this.name = 'StoryGenerationError';
    }
}

/**
 * 유효성 검사 옵션
 */
export interface ValidationOptions {
    minWords?: number;
    maxWords?: number;
    allowSpecialChars?: boolean;
}
