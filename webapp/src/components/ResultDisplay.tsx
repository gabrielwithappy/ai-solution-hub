import React from 'react';
import Button from './ui/Button';

interface ResultDisplayProps {
  results: string[];
}

export default function ResultDisplay({ results }: ResultDisplayProps) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col gap-2 mt-4">
      {results.map((result, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="flex-1 bg-gray-100 p-2 rounded">{result}</span>
          <Button type="button" onClick={() => handleCopy(result)}>
            복사
          </Button>
        </div>
      ))}
    </div>
  );
}
