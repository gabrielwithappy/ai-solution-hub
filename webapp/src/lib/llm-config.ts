/**
 * LLM API 설정 및 환경변수 관리 유틸리티
 */

export type LLMProvider = 'openai' | 'gemini' | 'claude';

export interface LLMConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
}

/**
 * 환경변수에서 LLM 설정을 가져오는 함수
 */
export function getLLMConfig(provider: LLMProvider): LLMConfig | null {
  switch (provider) {
    case 'openai':
      return {
        apiKey: process.env.OPENAI_API_KEY || '',
        apiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
      };

    case 'gemini':
      return {
        apiKey: process.env.GEMINI_API_KEY || '',
        apiUrl: process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        model: process.env.GEMINI_MODEL || 'gemini-pro'
      };

    case 'claude':
      return {
        apiKey: process.env.CLAUDE_API_KEY || '',
        apiUrl: process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages',
        model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229'
      };

    default:
      return null;
  }
}

/**
 * 사용 가능한 LLM 제공자를 반환하는 함수
 */
export function getAvailableProviders(): LLMProvider[] {
  const providers: LLMProvider[] = [];

  // 유효한 API 키인지 확인 (더미 값이나 빈 문자열 제외)
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey !== 'your_openai_api_key_here' && openaiKey.startsWith('sk-')) {
    providers.push('openai');
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey &&
    geminiKey !== 'your_gemini_api_key_here' &&
    (geminiKey.startsWith('AIza') || geminiKey.length > 20)) {
    providers.push('gemini');
  }

  const claudeKey = process.env.CLAUDE_API_KEY;
  if (claudeKey && claudeKey !== 'your_claude_api_key_here' && claudeKey.startsWith('sk-ant-')) {
    providers.push('claude');
  }

  return providers;
}

/**
 * 기본 LLM 제공자를 반환하는 함수
 */
export function getPrimaryProvider(): LLMProvider {
  const primaryProvider = process.env.LLM_PROVIDER as LLMProvider;
  const availableProviders = getAvailableProviders();

  // 환경변수에 설정된 primary provider가 사용 가능한지 확인
  if (primaryProvider && availableProviders.includes(primaryProvider)) {
    return primaryProvider;
  }

  // 사용 가능한 첫 번째 제공자 반환
  if (availableProviders.length > 0) {
    return availableProviders[0];
  }

  // 아무 프로바이더도 설정되지 않은 경우 기본값 반환
  // 이 경우 API 호출 시 에러가 발생할 것임
  return 'gemini'; // openai 대신 gemini를 기본값으로 변경
}

/**
 * 대체 LLM 제공자를 반환하는 함수
 */
export function getFallbackProvider(): LLMProvider | null {
  const fallbackProvider = process.env.LLM_FALLBACK_PROVIDER as LLMProvider;
  const availableProviders = getAvailableProviders();

  if (fallbackProvider && availableProviders.includes(fallbackProvider)) {
    return fallbackProvider;
  }

  // primary가 아닌 다른 사용 가능한 제공자 반환
  const primaryProvider = getPrimaryProvider();
  const alternatives = availableProviders.filter(p => p !== primaryProvider);

  return alternatives[0] || null;
}

/**
 * 환경변수 검증 함수
 */
export function validateLLMConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const availableProviders = getAvailableProviders();

  if (availableProviders.length === 0) {
    errors.push('LLM API 키가 설정되지 않았습니다. OPENAI_API_KEY, GEMINI_API_KEY, 또는 CLAUDE_API_KEY 중 하나 이상을 설정해주세요.');
  }

  const primaryProvider = process.env.LLM_PROVIDER as LLMProvider;
  if (primaryProvider && !availableProviders.includes(primaryProvider)) {
    warnings.push(`LLM_PROVIDER로 설정된 '${primaryProvider}'의 API 키가 없습니다. 사용 가능한 제공자: ${availableProviders.join(', ')}`);
  }

  const fallbackProvider = process.env.LLM_FALLBACK_PROVIDER as LLMProvider;
  if (fallbackProvider && !availableProviders.includes(fallbackProvider)) {
    warnings.push(`LLM_FALLBACK_PROVIDER로 설정된 '${fallbackProvider}'의 API 키가 없습니다.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
