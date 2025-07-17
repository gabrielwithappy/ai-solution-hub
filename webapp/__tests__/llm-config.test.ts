/**
 * LLM 설정 테스트
 * 환경변수 변경 시 동적으로 LLM provider가 어떻게 선택되는지 확인
 */

import { 
  validateLLMConfig, 
  getAvailableProviders, 
  getPrimaryProvider, 
  getFallbackProvider 
} from '../src/lib/llm-config';

describe('LLM Config Tests', () => {
  // 원본 환경변수 백업
  const originalEnv = process.env;

  beforeEach(() => {
    // 각 테스트 전에 환경변수 초기화
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // 테스트 완료 후 원본 환경변수 복원
    process.env = originalEnv;
  });

  test('OpenAI만 설정된 경우', () => {
    // 환경변수 설정
    process.env.OPENAI_API_KEY = 'sk-test123';
    process.env.LLM_PROVIDER = 'openai';
    
    // 테스트
    expect(getAvailableProviders()).toEqual(['openai']);
    expect(getPrimaryProvider()).toBe('openai');
    expect(getFallbackProvider()).toBeNull();
    
    const validation = validateLLMConfig();
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('OpenAI + Gemini 설정, OpenAI primary', () => {
    // 환경변수 설정
    process.env.OPENAI_API_KEY = 'sk-test123';
    process.env.GEMINI_API_KEY = 'AIza-test123';
    process.env.LLM_PROVIDER = 'openai';
    process.env.LLM_FALLBACK_PROVIDER = 'gemini';
    
    // 테스트
    expect(getAvailableProviders()).toEqual(['openai', 'gemini']);
    expect(getPrimaryProvider()).toBe('openai');
    expect(getFallbackProvider()).toBe('gemini');
  });

  test('Gemini primary, OpenAI fallback으로 변경', () => {
    // 환경변수 설정 변경
    process.env.OPENAI_API_KEY = 'sk-test123';
    process.env.GEMINI_API_KEY = 'AIza-test123';
    process.env.LLM_PROVIDER = 'gemini';  // 🔄 primary 변경!
    process.env.LLM_FALLBACK_PROVIDER = 'openai';  // 🔄 fallback 변경!
    
    // 테스트 - 환경변수 변경이 즉시 반영됨
    expect(getPrimaryProvider()).toBe('gemini');
    expect(getFallbackProvider()).toBe('openai');
  });

  test('설정되지 않은 provider 지정 시 경고', () => {
    // 환경변수 설정
    process.env.OPENAI_API_KEY = 'sk-test123';
    process.env.LLM_PROVIDER = 'claude';  // ❌ API 키가 없는 provider
    
    // 테스트
    expect(getPrimaryProvider()).toBe('openai');  // 사용 가능한 첫 번째로 fallback
    
    const validation = validateLLMConfig();
    expect(validation.warnings).toContain(
      "LLM_PROVIDER로 설정된 'claude'의 API 키가 없습니다. 사용 가능한 제공자: openai"
    );
  });

  test('모든 API 키가 없는 경우 에러', () => {
    // 모든 API 키 제거
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.CLAUDE_API_KEY;
    
    // 테스트
    expect(getAvailableProviders()).toEqual([]);
    
    const validation = validateLLMConfig();
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain(
      'LLM API 키가 설정되지 않았습니다. OPENAI_API_KEY, GEMINI_API_KEY, 또는 CLAUDE_API_KEY 중 하나 이상을 설정해주세요.'
    );
  });

  test('런타임에 새로운 API 키 추가', () => {
    // 초기 상태: OpenAI만 있음
    process.env.OPENAI_API_KEY = 'sk-test123';
    expect(getAvailableProviders()).toEqual(['openai']);
    
    // 🆕 런타임에 Gemini API 키 추가
    process.env.GEMINI_API_KEY = 'AIza-test123';
    process.env.LLM_FALLBACK_PROVIDER = 'gemini';
    
    // 즉시 반영됨!
    expect(getAvailableProviders()).toEqual(['openai', 'gemini']);
    expect(getFallbackProvider()).toBe('gemini');
  });
});
