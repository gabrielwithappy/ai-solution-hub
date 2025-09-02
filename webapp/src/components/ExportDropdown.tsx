'use client';

import { useState, useRef, useEffect } from 'react';
import { StoryResponse } from '@/lib/english-story.types';
import { exportStoryToExcel } from '@/lib/excel-utils';
import { generateMarkdownFromTemplate, getAvailableTemplates, TemplateType } from '@/lib/markdown-template';

interface ExportDropdownProps {
    story: StoryResponse;
    className?: string;
}

export function ExportDropdown({ story, className = '' }: ExportDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showMarkdownTemplates, setShowMarkdownTemplates] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // HTML 태그 제거 함수
    const stripHtmlTags = (html: string): string => {
        return html.replace(/<[^>]*>/g, '');
    };

    // 클립보드 복사 함수
    const copyToClipboard = async (text: string) => {
        try {
            const plainText = stripHtmlTags(text);
            await navigator.clipboard.writeText(plainText);
            alert('클립보드에 복사되었습니다.');
        } catch (err) {
            console.error('클립보드 복사 실패:', err);
            alert('클립보드 복사에 실패했습니다.');
        }
    };

    // Excel 내보내기 함수
    const handleExcelExport = async () => {
        try {
            const blob = await exportStoryToExcel(story);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `영어스토리_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Excel 내보내기 실패:', error);
            alert('Excel 내보내기에 실패했습니다.');
        }
    };

    // Markdown 내보내기 함수 (템플릿 사용)
    const handleMarkdownExport = (templateType: TemplateType = 'default') => {
        try {
            const markdownContent = generateMarkdownFromTemplate(story, templateType);
            const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `영어스토리_${templateType}_${new Date().toISOString().split('T')[0]}.md`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Markdown 내보내기 실패:', error);
            alert('Markdown 내보내기에 실패했습니다.');
        }
    };

    // 드롭다운 메뉴 항목 클릭 핸들러
    const handleMenuClick = async (action: 'clipboard' | 'excel' | 'markdown' | 'markdownTemplate') => {
        if (action === 'markdownTemplate') {
            setShowMarkdownTemplates(!showMarkdownTemplates);
            return;
        }

        setIsOpen(false);
        setShowMarkdownTemplates(false);

        switch (action) {
            case 'clipboard':
                await copyToClipboard(story.englishStory);
                break;
            case 'excel':
                await handleExcelExport();
                break;
            case 'markdown':
                handleMarkdownExport('default');
                break;
        }
    };    // 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowMarkdownTemplates(false);
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setShowMarkdownTemplates(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen]);

    return (
        <div className={`relative inline-block ${className}`} ref={dropdownRef}>
            {/* 드롭다운 버튼 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-10 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                type="button"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                📁 내보내기
                <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* 드롭다운 메뉴 */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                        <button
                            onClick={() => handleMenuClick('clipboard')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                        >
                            📋 클립보드 복사
                        </button>
                        <button
                            onClick={() => handleMenuClick('excel')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                        >
                            📊 Excel 내보내기
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => handleMenuClick('markdownTemplate')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between gap-3"
                            >
                                <span className="flex items-center gap-3">
                                    📝 Markdown 내보내기
                                </span>
                                <span className="text-xs">▶</span>
                            </button>
                            {showMarkdownTemplates && (
                                <div className="absolute left-full top-0 ml-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                    <div className="py-1">
                                        {getAvailableTemplates().map((template) => (
                                            <button
                                                key={template.key}
                                                onClick={() => {
                                                    handleMarkdownExport(template.key);
                                                    setIsOpen(false);
                                                    setShowMarkdownTemplates(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <div className="font-medium">{template.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
