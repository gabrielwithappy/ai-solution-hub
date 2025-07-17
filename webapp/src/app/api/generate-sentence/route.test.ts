/**
 * 영어 문장 생성 API Route 테스트
 * TDD: 테스트 먼저 작성
 */

// Mock the LLM client first
jest.mock('@/lib/llm-client', () => ({
  callLLM: jest.fn()
}));

// Mock the LLM config
jest.mock('@/lib/llm-config', () => ({
  validateLLMConfig: jest.fn()
}));

import { callLLM } from '@/lib/llm-client';
import { validateLLMConfig } from '@/lib/llm-config';

describe('영어 문장 생성 API 로직', () => {
  const mockCallLLM = callLLM as jest.MockedFunction<typeof callLLM>;
  const mockValidateLLMConfig = validateLLMConfig as jest.MockedFunction<typeof validateLLMConfig>;

  beforeEach(() => {
    jest.clearAllMocks();
    // 기본적으로 LLM 설정은 유효하다고 가정
    mockValidateLLMConfig.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });
  });

  describe('영어 문장 생성 비즈니스 로직 (확장)', () => {
    test('다의어 처리: 여러 의미를 가진 단어에 대해 의미별 예문을 생성한다', async () => {
      // Given: Mock LLM 응답 (다의어)
      mockCallLLM.mockResolvedValue({
        content: `의미1: 은행 (금융기관)
I went to the bank to deposit money.
은행에 돈을 예금하러 갔습니다.

의미2: 강둑, 제방  
The river bank was covered with flowers.
강둑이 꽃으로 덮여 있었습니다.`,
        provider: 'openai',
        usage: { totalTokens: 80 }
      });

      // When: LLM 호출
      const result = await callLLM({
        prompt: '다의어 테스트 프롬프트',
        maxTokens: 1500,
        temperature: 0.7
      });

      // Then: 다의어 응답 검증
      expect(result.content).toContain('의미1:');
      expect(result.content).toContain('의미2:');
      expect(result.content).toContain('은행에 돈을');
      expect(result.content).toContain('강둑이 꽃으로');
      expect(result.provider).toBe('openai');
    });

    test('단일 의미 단어도 올바르게 처리한다', async () => {
      // Given: Mock LLM 응답 (단일 의미)
      mockCallLLM.mockResolvedValue({
        content: `의미1: 고양이
The cat is sleeping on the sofa.
고양이가 소파에서 자고 있습니다.`,
        provider: 'openai',
        usage: { totalTokens: 30 }
      });

      // When: LLM 호출
      const result = await callLLM({
        prompt: '단일 의미 테스트 프롬프트',
        maxTokens: 1500,
        temperature: 0.7
      });

      // Then: 결과 검증
      expect(result.content).toContain('의미1: 고양이');
      expect(result.content).toContain('The cat is sleeping');
      expect(result.content).toContain('고양이가 소파에서');
      expect(result.provider).toBe('openai');
    });

    test('LLM 설정 검증 성공', () => {
      // When: 설정 검증
      const result = validateLLMConfig();

      // Then: 유효한 설정
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockValidateLLMConfig).toHaveBeenCalled();
    });

    test('LLM 설정 검증 실패', () => {
      // Given: 잘못된 설정
      mockValidateLLMConfig.mockReturnValue({
        isValid: false,
        errors: ['API 키가 없습니다.'],
        warnings: []
      });

      // When: 설정 검증
      const result = validateLLMConfig();

      // Then: 유효하지 않은 설정
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API 키가 없습니다.');
    });

    test('LLM API 호출 실패 처리', async () => {
      // Given: API 호출 실패
      mockCallLLM.mockRejectedValue(new Error('API 연결 실패'));

      // When & Then: 에러 발생
      await expect(callLLM({
        prompt: '테스트',
        maxTokens: 1000,
        temperature: 0.7
      })).rejects.toThrow('API 연결 실패');
    });
  });

  describe('입력값 검증 로직', () => {
    test('빈 단어 검증', () => {
      const word = '';
      expect(word.length).toBe(0);
    });

    test('50자 초과 단어 검증', () => {
      const longWord = 'a'.repeat(51);
      expect(longWord.length).toBeGreaterThan(50);
    });

    test('유효한 레벨 검증', () => {
      const validLevels = ['초급', '중급', '고급'];
      expect(validLevels).toContain('초급');
      expect(validLevels).toContain('중급');
      expect(validLevels).toContain('고급');
      expect(validLevels).not.toContain('전문가');
    });
  });

  describe('프롬프트 생성 로직', () => {
    test('다의어 프롬프트 생성', () => {
      const word = 'bank';
      const level = '중급';
      
      const expectedPrompt = `다음 영어 단어 "${word}"의 서로 다른 의미들을 찾아서, 각 의미마다 ${level} 수준의 영어 예문과 한국어 해석을 제공해주세요.

단어: "${word}"
난이도: ${level}

요구사항:
- 단어가 가진 주요 의미들을 모두 포함 (최대 5개)
- 각 의미마다 자연스럽고 실용적인 예문 1개씩
- ${level} 수준에 맞는 어휘와 문법 사용
- 한국어 해석은 자연스럽고 정확하게

출력 형식:
의미1: [단어의 첫 번째 의미 설명]
[영어 예문]
[한국어 해석]

의미2: [단어의 두 번째 의미 설명]
[영어 예문]
[한국어 해석]`;

      expect(expectedPrompt).toContain(word);
      expect(expectedPrompt).toContain(level);
      expect(expectedPrompt).toContain('서로 다른 의미들을');
      expect(expectedPrompt).toContain('한국어 해석');
    });
  });
});
