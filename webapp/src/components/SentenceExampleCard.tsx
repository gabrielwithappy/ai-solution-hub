/**
 * 개별 문장 예시 카드 컴포넌트
 * scrambled 문장과 정답 공개 기능 포함
 */

'use client';

import { useState } from 'react';
import Button from './ui/Button';
import { ttsUtility } from '../lib/tts';

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
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);

  // TTS 지원 여부 직접 확인 (useEffect로 한 번 확인하는 것보다 실시간 확인)
  const isTTSSupported = ttsUtility.isSupported();

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // TODO: 복사 완료 토스트 메시지 표시
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  const handleTTSPlay = async () => {
    if (!isTTSSupported || isTTSPlaying) return;

    try {
      setIsTTSPlaying(true);
      await ttsUtility.speak(example.originalSentence, {
        lang: 'en-US',
        rate: 0.9,
        pitch: 1,
        volume: 1,
      });
    } catch (error) {
      console.error('TTS 재생 실패:', error);
    } finally {
      setIsTTSPlaying(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow">
      {/* 의미 표시 */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">
          의미 {index + 1}: {example.meaning}
        </h3>
        <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
          문장 맞추기
        </span>
      </div>

      {/* Scrambled 문장 (항상 표시) */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h4 className="text-sm font-medium text-yellow-800 mb-3">
          🧩 단어를 올바른 순서로 배열해보세요
        </h4>
        <p className="text-xl text-yellow-900 font-mono leading-relaxed">
          {example.scrambledSentence}
        </p>
      </div>

      {/* 정답 공개 버튼 */}
      {!showAnswer && (
        <Button
          onClick={() => setShowAnswer(true)}
          className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
        >
          정답 확인하기
        </Button>
      )}

      {/* 정답 영역 (버튼 클릭 시 표시) */}
      {showAnswer && (
        <div className="space-y-4">
          {/* 완성된 영어 문장 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-green-800">
                ✅ 정답 문장
              </h4>
              <div className="flex gap-2">
                {/* TTS 버튼 */}
                {isTTSSupported && (
                  <button
                    onClick={handleTTSPlay}
                    disabled={isTTSPlaying}
                    aria-label={`영어 문장 음성으로 듣기: ${example.originalSentence}`}
                    className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-800 bg-green-100 hover:bg-green-200 px-4 py-2 rounded-lg border border-green-300 hover:border-green-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    <span className="text-base">{isTTSPlaying ? '🔊' : '🔊'}</span>
                    <span>{isTTSPlaying ? '재생 중...' : '음성 듣기'}</span>
                  </button>
                )}
                {/* 복사 버튼 */}
                <button
                  onClick={() => handleCopy(example.originalSentence)}
                  className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-800 bg-green-100 hover:bg-green-200 px-4 py-2 rounded-lg border border-green-300 hover:border-green-400 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <span className="text-base">📋</span>
                  <span>복사</span>
                </button>
              </div>
            </div>
            <p className="text-xl text-green-900 leading-relaxed">
              {example.originalSentence}
            </p>
          </div>

          {/* 한국어 해석 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-blue-800">
                🇰🇷 한국어 해석
              </h4>
              <button
                onClick={() => handleCopy(example.koreanTranslation)}
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 px-4 py-2 rounded-lg border border-blue-300 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <span className="text-base">📋</span>
                <span>복사</span>
              </button>
            </div>
            <p className="text-xl text-blue-900 leading-relaxed">
              {example.koreanTranslation}
            </p>
          </div>

          {/* 다시 숨기기 버튼 */}
          <Button
            onClick={() => setShowAnswer(false)}
            className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 py-3"
          >
            정답 숨기기
          </Button>
        </div>
      )}
    </div>
  );
}
