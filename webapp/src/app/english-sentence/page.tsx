/**
 * 영어 문장 생성 페이지
 * /english-sentence 경로
 */

'use client';

import { useState } from 'react';
import { EnglishSentenceForm, SentenceExample } from '@/components/EnglishSentenceForm';
import { SentenceExampleCard } from '@/components/SentenceExampleCard';
import LoadingIndicator from '@/components/ui/LoadingIndicator';

interface GeneratedResult {
  examples: SentenceExample[];
  provider?: string;
}

export default function EnglishSentencePage() {
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResult = (newResult: GeneratedResult) => {
    setResult(newResult);
    setIsLoading(false);
  };

  const handleFormSubmit = () => {
    setIsLoading(true);
    setResult(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          영어 문장 생성
        </h1>
        <p className="text-gray-600">
          영어 단어를 입력하면 AI가 그 단어를 활용한 난이도별 예시 문장을 생성해드립니다.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 입력 폼 영역 */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              단어 입력
            </h2>
            <EnglishSentenceForm onResult={handleResult} />
          </div>

          {/* 사용 예시 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              💡 사용 예시
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• cat (고양이)</li>
              <li>• study (공부하다)</li>
              <li>• beautiful (아름다운)</li>
            </ul>
          </div>
        </div>

        {/* 결과 표시 영역 */}
        <div className="space-y-6">
          {isLoading && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-center py-8">
                <LoadingIndicator />
                <span className="ml-3 text-gray-600">AI가 문장을 생성하고 있습니다...</span>
              </div>
            </div>
          )}

          {result && !isLoading && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  생성된 예시 문장들
                </h2>
                {result.provider && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {result.provider}
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                {result.examples.map((example, index) => (
                  <SentenceExampleCard
                    key={index}
                    example={example}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {!result && !isLoading && (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  단어를 입력해주세요
                </h3>
                <p className="text-gray-600">
                  좌측 폼에 영어 단어를 입력하고 난이도를 선택하면<br />
                  AI가 그 단어를 활용한 다양한 예시 문장을 생성해드립니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 안내 정보 */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 기능 안내
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">단어 기반 생성</h4>
            <p className="text-sm text-gray-600">
              입력한 단어를 포함한 자연스럽고 실용적인 예시 문장을 생성합니다.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">난이도별 제공</h4>
            <p className="text-sm text-gray-600">
              초급, 중급, 고급 수준에 맞는 어휘와 문법을 사용한 문장을 제공합니다.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">간편한 복사</h4>
            <p className="text-sm text-gray-600">
              생성된 각 문장을 클릭 한 번으로 클립보드에 복사할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
