/**
 * Excel 내보내기 버튼 컴포넌트
 * 요구사항: FR-039 ~ FR-042
 */

'use client';

import React, { useState } from 'react';
import { StoryResponse } from '@/lib/english-story.types';
import { exportToExcel, isExcelExportSupported } from '@/lib/excel-utils';

interface ExcelExportButtonProps {
    story: StoryResponse;
    variant?: 'primary' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
}

export function ExcelExportButton({
    story,
    variant = 'secondary',
    size = 'md',
    disabled = false
}: ExcelExportButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async () => {
        if (!story || story.usedWords.length === 0) {
            setError('내보낼 단어가 없습니다.');
            return;
        }

        if (!isExcelExportSupported()) {
            setError('이 브라우저에서는 Excel 내보내기를 지원하지 않습니다.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await exportToExcel(story);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Excel 내보내기 중 오류가 발생했습니다.';
            setError(errorMessage);
            console.error('Excel 내보내기 오류:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // 스타일 변수들
    const baseClasses = "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantClasses = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500"
    };

    const sizeClasses = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg"
    };

    const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;

    return (
        <div className="flex flex-col">
            <button
                onClick={handleExport}
                disabled={disabled || isLoading || !story || story.usedWords.length === 0}
                className={buttonClasses}
                title="영어 단어를 Excel 파일로 내보내기"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        내보내는 중...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Excel 내보내기
                    </>
                )}
            </button>

            {error && (
                <div className="mt-2 text-sm text-red-600">
                    {error}
                </div>
            )}

            {story && story.usedWords.length > 0 && !error && (
                <div className="mt-1 text-xs text-gray-500">
                    {story.usedWords.length}개 단어를 Excel로 내보내기
                </div>
            )}
        </div>
    );
}

export default ExcelExportButton;
