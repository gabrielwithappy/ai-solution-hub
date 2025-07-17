/**
 * 개별 문장 예시 카드 컴포넌트
 * scrambled 문장과 정답 공개 기능 포함
 */

'use client';

import { useState } from 'react';
import Button from './ui/Button';

export interface SentenceExample {
  meaning: string;
  originalSentence: string;
  scrambledSentence: string;
  koreanTranslation: string;
}

interface SentenceExampleCardProps {
  example: SentenceExample;
  index: number;
}

export function SentenceExampleCard({ example, index }: SentenceExampleCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // TODO: 복사 완료 토스트 메시지 표시
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* 의미 표시 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          의미 {index + 1}: {example.meaning}
        </h3>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          문장 맞추기
        </span>
      </div>

      {/* Scrambled 문장 (항상 표시) */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">
          🧩 단어를 올바른 순서로 배열해보세요
        </h4>
        <p className="text-lg text-yellow-900 font-mono">
          {example.scrambledSentence}
        </p>
      </div>

      {/* 정답 공개 버튼 */}
      {!showAnswer && (
        <Button
          onClick={() => setShowAnswer(true)}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          정답 확인하기
        </Button>
      )}

      {/* 정답 영역 (버튼 클릭 시 표시) */}
      {showAnswer && (
        <div className="space-y-3">
          {/* 완성된 영어 문장 */}
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-green-800">
                ✅ 정답 문장
              </h4>
              <button
                onClick={() => handleCopy(example.originalSentence)}
                className="text-xs text-green-600 hover:text-green-800"
              >
                복사
              </button>
            </div>
            <p className="text-lg text-green-900">
              {example.originalSentence}
            </p>
          </div>

          {/* 한국어 해석 */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-800">
                🇰🇷 한국어 해석
              </h4>
              <button
                onClick={() => handleCopy(example.koreanTranslation)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                복사
              </button>
            </div>
            <p className="text-lg text-blue-900">
              {example.koreanTranslation}
            </p>
          </div>

          {/* 다시 숨기기 버튼 */}
          <Button
            onClick={() => setShowAnswer(false)}
            className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            정답 숨기기
          </Button>
        </div>
      )}
    </div>
  );
}
