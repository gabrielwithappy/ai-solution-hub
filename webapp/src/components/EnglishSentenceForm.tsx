/**
 * 영어 문장 생성 입력 폼 컴포넌트
 * TDD Green 단계: 테스트를 통과시키기 위한 최소 구현
 */

'use client';

import { useState } from 'react';
import Button from './ui/Button';

export interface EnglishSentenceFormProps {
  onResult: (result: { sentences: string[]; provider?: string }) => void;
}

export type SentenceLevel = '초급' | '중급' | '고급';

export function EnglishSentenceForm({ onResult }: EnglishSentenceFormProps) {
  const [text, setText] = useState('');
  const [level, setLevel] = useState<SentenceLevel>('초급');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const maxLength = 500;
  const isTextValid = text.trim().length > 0 && text.length <= maxLength;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 입력값 검증
    if (!text.trim()) {
      setError('텍스트를 입력해주세요.');
      return;
    }

    if (text.length > maxLength) {
      setError('500자를 초과할 수 없습니다.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/generate-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    
    // 실시간 글자수 검증
    if (newText.length > maxLength) {
      setError('500자를 초과할 수 없습니다.');
    } else {
      setError('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 영어 문장 입력 */}
      <div className="space-y-2">
        <label htmlFor="english-text" className="block text-sm font-medium text-gray-700">
          영어 문장 입력
        </label>
        <textarea
          id="english-text"
          value={text}
          onChange={handleTextChange}
          placeholder="영어 문장을 입력하세요. 예: I love programming"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          disabled={isLoading}
        />
        
        {/* 글자 수 카운터 */}
        <div className="flex justify-between items-center text-sm">
          <span className={`${text.length > maxLength ? 'text-red-500' : 'text-gray-500'}`}>
            {text.length} / {maxLength}
          </span>
        </div>
      </div>

      {/* 난이도 선택 */}
      <div className="space-y-2">
        <label htmlFor="level-select" className="block text-sm font-medium text-gray-700">
          난이도 선택
        </label>
        <select
          id="level-select"
          value={level}
          onChange={(e) => setLevel(e.target.value as SentenceLevel)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
        disabled={isLoading || text.length > maxLength}
        className="w-full"
      >
        {isLoading ? '생성 중...' : '문장 생성'}
      </Button>
    </form>
  );
}
