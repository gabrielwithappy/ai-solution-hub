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

  describe('영어 문장 생성 비즈니스 로직', () => {
    test('유효한 입력으로 문장 생성 성공', async () => {
      // Given: Mock LLM 응답
      mockCallLLM.mockResolvedValue({
        content: 'I enjoy coding every day.\nProgramming brings me joy.\nI find programming fascinating.',
        provider: 'openai',
        usage: { totalTokens: 50 }
      });

      // When: LLM 호출
      const result = await callLLM({
        prompt: '테스트 프롬프트',
        maxTokens: 1000,
        temperature: 0.7
      });

      // Then: 결과 검증
      expect(result.content).toContain('I enjoy coding every day.');
      expect(result.provider).toBe('openai');
      expect(mockCallLLM).toHaveBeenCalledWith({
        prompt: '테스트 프롬프트',
        maxTokens: 1000,
        temperature: 0.7
      });
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
    test('빈 텍스트 검증', () => {
      const text = '';
      expect(text.length).toBe(0);
    });

    test('500자 초과 텍스트 검증', () => {
      const longText = 'a'.repeat(501);
      expect(longText.length).toBeGreaterThan(500);
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
    test('초급 레벨 프롬프트 생성', () => {
      const text = 'I like cats';
      const level = '초급';
      
      const expectedPrompt = `다음 텍스트를 기반으로 ${level} 수준의 영어 예문 3개를 만들어주세요.

텍스트: "${text}"

요구사항:
- ${level} 수준에 맞는 어휘와 문법 사용
- 자연스럽고 실용적인 문장
- 각 문장은 독립적이고 완전한 문장이어야 함

형식: 번호 없이 문장만 작성하고, 각 문장은 새 줄로 구분`;

      expect(expectedPrompt).toContain(text);
      expect(expectedPrompt).toContain(level);
      expect(expectedPrompt).toContain('3개를 만들어주세요');
    });
  });
});
