/**
 * 영어 문장 생성 입력 폼 컴포넌트
 * TDD Green 단계: 테스트를 통과시키기 위한 최소 구현
 */

'use client';

import { useState } from 'react';
import Button from './ui/Button';

export interface EnglishSentenceFormProps {
  onResult: (result: { examples: SentenceExample[]; provider?: string }) => void;
}

export interface SentenceExample {
  meaning: string;
  originalSentence: string;
  scrambledSentence: string;
  koreanTranslation: string;
}

export type SentenceLevel = '초급' | '중급' | '고급';

export function EnglishSentenceForm({ onResult }: EnglishSentenceFormProps) {
  const [word, setWord] = useState('');
  const [level, setLevel] = useState<SentenceLevel>('초급');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const maxLength = 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 입력값 검증
    if (!word.trim()) {
      setError('영어 단어를 입력해주세요.');
      return;
    }

    if (word.length > maxLength) {
      setError('50자를 초과할 수 없습니다.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/generate-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: word.trim(),
          level
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      onResult(result);
      
    } catch (error) {
      console.error('영어 문장 생성 실패:', error);
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWord = e.target.value;
    setWord(newWord);
    
    // 실시간 글자수 검증
    if (newWord.length > maxLength) {
      setError('50자를 초과할 수 없습니다.');
    } else {
      setError('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 영어 단어 입력 */}
      <div className="space-y-3">
        <label htmlFor="english-word" className="block text-sm font-medium text-gray-700">
          영어 단어 입력
        </label>
        <input
          type="text"
          id="english-word"
          value={word}
          onChange={handleWordChange}
          placeholder="영어 단어를 입력하세요. 예: cat, study, happy"
          className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
        
        {/* 글자 수 카운터 */}
        <div className="flex justify-between items-center text-sm">
          <span className={`${word.length > maxLength ? 'text-red-500' : 'text-gray-500'}`}>
            {word.length} / {maxLength}
          </span>
        </div>
      </div>

      {/* 난이도 선택 */}
      <div className="space-y-3">
        <label htmlFor="level-select" className="block text-sm font-medium text-gray-700">
          난이도 선택
        </label>
        <select
          id="level-select"
          value={level}
          onChange={(e) => setLevel(e.target.value as SentenceLevel)}
          className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        >
          <option value="초급">초급</option>
          <option value="중급">중급</option>
          <option value="고급">고급</option>
        </select>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* 제출 버튼 */}
      <Button
        type="submit"
        disabled={isLoading || word.length > maxLength}
        className="w-full text-lg py-3"
      >
        {isLoading ? '생성 중...' : '문장 생성'}
      </Button>
    </form>
  );
}
