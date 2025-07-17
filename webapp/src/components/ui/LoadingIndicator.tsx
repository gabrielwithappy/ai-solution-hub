import React from 'react';

export default function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600" />
      <span className="ml-2 text-blue-600">로딩 중...</span>
    </div>
  );
}
