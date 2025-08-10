/**
 * LLM API 클라이언트 유틸리티
 */

import {
  LLMProvider,
  LLMConfig,
  getLLMConfig,
  getPrimaryProvider,
  getFallbackProvider,
  getAvailableProviders
} from './llm-config';

export interface LLMRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

// API 응답 타입 정의
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

interface ClaudeResponse {
  content: Array<{
    text: string;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

/**
 * OpenAI API 호출 함수
 */
async function callOpenAI(config: LLMConfig, request: LLMRequest): Promise<LLMResponse> {
  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: request.prompt }],
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API 오류: ${response.status} ${response.statusText}`);
  }

  const data: OpenAIResponse = await response.json();

  return {
    content: data.choices[0]?.message?.content || '',
    provider: 'openai',
    usage: {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      totalTokens: data.usage?.total_tokens
    }
  };
}

/**
 * Gemini API 호출 함수
 */
async function callGemini(config: LLMConfig, request: LLMRequest): Promise<LLMResponse> {
  const response = await fetch(`${config.apiUrl}?key=${config.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: request.prompt }]
      }],
      generationConfig: {
        temperature: request.temperature || 0.7,
        maxOutputTokens: request.maxTokens || 2000
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API 오류: ${response.status} ${response.statusText}`);
  }

  const data: GeminiResponse = await response.json();

  return {
    content: data.candidates[0]?.content?.parts[0]?.text || '',
    provider: 'gemini',
    usage: {
      promptTokens: data.usageMetadata?.promptTokenCount,
      completionTokens: data.usageMetadata?.candidatesTokenCount,
      totalTokens: data.usageMetadata?.totalTokenCount
    }
  };
}

/**
 * Claude API 호출 함수
 */
async function callClaude(config: LLMConfig, request: LLMRequest): Promise<LLMResponse> {
  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.7,
      messages: [{ role: 'user', content: request.prompt }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API 오류: ${response.status} ${response.statusText}`);
  }

  const data: ClaudeResponse = await response.json();

  return {
    content: data.content[0]?.text || '',
    provider: 'claude',
    usage: {
      promptTokens: data.usage?.input_tokens,
      completionTokens: data.usage?.output_tokens,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
    }
  };
}

/**
 * LLM API 호출 (fallback 지원)
 */
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const primaryProvider = getPrimaryProvider();
  const fallbackProvider = getFallbackProvider();
  const availableProviders = getAvailableProviders();

  console.log(`🤖 LLM 호출 - 사용 가능한 프로바이더: ${availableProviders.join(', ')}`);

  try {
    // Primary provider 시도
    const primaryConfig = getLLMConfig(primaryProvider);
    if (!primaryConfig?.apiKey) {
      throw new Error(`${primaryProvider} API 키가 설정되지 않음`);
    }

    const response = await callLLMWithProvider(primaryProvider, primaryConfig, request);
    console.log(`✅ ${primaryProvider} API 호출 성공`);
    return response;

  } catch (error) {
    // Primary provider 실패 시 fallback 시도
    if (fallbackProvider) {
      console.log(`⚠️  ${primaryProvider} 사용 불가, ${fallbackProvider}로 전환 중...`);

      try {
        const fallbackConfig = getLLMConfig(fallbackProvider);
        if (!fallbackConfig?.apiKey) {
          throw new Error(`${fallbackProvider} API 키가 설정되지 않음`);
        }

        const response = await callLLMWithProvider(fallbackProvider, fallbackConfig, request);
        console.log(`✅ ${fallbackProvider} API 호출 성공 (대체 프로바이더)`);
        return response;

      } catch (fallbackError) {
        console.error(`❌ ${fallbackProvider} API 호출도 실패:`, fallbackError);
        throw new Error(`모든 LLM API 호출 실패. Primary: ${error}, Fallback: ${fallbackError}`);
      }
    } else {
      console.error(`❌ ${primaryProvider} API 호출 실패, 사용 가능한 대체 프로바이더 없음:`, error);
      throw error;
    }
  }
}

/**
 * 특정 provider로 LLM API 호출
 */
async function callLLMWithProvider(
  provider: LLMProvider,
  config: LLMConfig,
  request: LLMRequest
): Promise<LLMResponse> {
  switch (provider) {
    case 'openai':
      return callOpenAI(config, request);
    case 'gemini':
      return callGemini(config, request);
    case 'claude':
      return callClaude(config, request);
    default:
      throw new Error(`지원되지 않는 LLM provider: ${provider}`);
  }
}
