/**
 * 프린트 버튼 컴포넌트
 * 요구사항: FR-033 ~ FR-038
 */

'use client';

import React, { useState } from 'react';
import { StoryResponse } from '@/lib/english-story.types';
import { printStory, generatePrintPreview } from '@/lib/print-utils';

interface PrintButtonProps {
    story: StoryResponse;
    variant?: 'primary' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
    showPreview?: boolean;
}

export function PrintButton({
    story,
    variant = 'secondary',
    size = 'md',
    showPreview = false
}: PrintButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePrint = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // 새 창에서 프린트 시도
            const printWindow = window.open('', '_blank');

            if (printWindow) {
                const printContent = generatePrintPreview(story);

                printWindow.document.write(printContent);
                printWindow.document.close();

                // 로딩 완료 후 프린트 실행
                printWindow.addEventListener('load', () => {
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                });
            } else {
                // window.open이 실패하면 fallback으로 현재 페이지에서 프린트
                if (typeof window !== 'undefined' && window.print) {
                    window.print();
                } else {
                    throw new Error('프린트 기능을 사용할 수 없습니다.');
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '프린트 중 오류가 발생했습니다.';
            setError(errorMessage);
            console.error('프린트 오류:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreview = () => {
        setShowPreviewModal(true);
    };

    const closePreview = () => {
        setShowPreviewModal(false);
    };

    // 스타일 클래스 생성
    const getButtonClasses = () => {
        const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

        const variantClasses = {
            primary: 'bg-blue-600 text-white hover:bg-blue-700',
            secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300'
        };

        const sizeClasses = {
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-4 py-2',
            lg: 'h-12 px-6 text-lg'
        };

        return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
    };

    return (
        <div className="print-button-container">
            <div className="flex gap-2">
                <button
                    onClick={handlePrint}
                    disabled={isLoading}
                    className={getButtonClasses()}
                    aria-label="프린트"
                >
                    {isLoading ? (
                        <>
                            <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                    className="opacity-25"
                                />
                                <path
                                    fill="currentColor"
                                    d="m15.84 10.32l-4.32-4.32-4.32 4.32 1.44 1.44 2.88-2.88 2.88 2.88z"
                                    className="opacity-75"
                                />
                            </svg>
                            처리 중...
                        </>
                    ) : (
                        <>
                            <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                />
                            </svg>
                            프린트
                        </>
                    )}
                </button>

                {showPreview && (
                    <button
                        onClick={handlePreview}
                        className={getButtonClasses()}
                        aria-label="프린트 미리보기"
                    >
                        <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                        </svg>
                        미리보기
                    </button>
                )}
            </div>

            {error && (
                <div className="mt-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                        <svg className="w-5 h-5 mr-2 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                        {error}
                    </div>
                </div>
            )}

            {/* 프린트 미리보기 모달 */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">프린트 미리보기</h3>
                            <button
                                onClick={closePreview}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="미리보기 닫기"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
                            <div
                                className="print-preview-content border border-gray-300 bg-white p-8 shadow-sm"
                                dangerouslySetInnerHTML={{ __html: generatePrintPreview(story) }}
                            />
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
                            <button
                                onClick={closePreview}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                닫기
                            </button>
                            <button
                                onClick={() => {
                                    closePreview();
                                    handlePrint();
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                            >
                                프린트
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
