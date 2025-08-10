/**
 * 프린트 기능 테스트
 * 요구사항: FR-033 ~ FR-038
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { generatePrintContent, formatDateForPrint, cleanTextForPrint } from '@/lib/print-utils';
import { PrintButton } from '@/components/PrintButton';
import { WordMeaning, StoryDifficulty } from '@/lib/english-story.types';

// Mock window.print and window.open
const mockPrint = jest.fn();
const mockWindowOpen = jest.fn();

Object.defineProperty(window, 'print', {
    value: mockPrint,
    writable: true,
});

Object.defineProperty(window, 'open', {
    value: mockWindowOpen,
    writable: true,
});

// Mock printWindow for window.open
const mockPrintWindow = {
    document: {
        write: jest.fn(),
        close: jest.fn(),
    },
    addEventListener: jest.fn(),
    focus: jest.fn(),
    print: jest.fn(),
    close: jest.fn(),
};

describe('프린트 기능 테스트', () => {
    const mockStory = {
        englishStory: 'Once upon a time, there was a <span style="color: #dc2626; font-weight: bold;">cat</span> who lived in a small <span style="color: #dc2626; font-weight: bold;">house</span>.',
        koreanTranslation: '옛날 옛적에, 작은 집에 사는 고양이가 있었습니다.',
        usedWords: [
            { englishWord: 'cat', koreanMeaning: '고양이' },
            { englishWord: 'house', koreanMeaning: '집' }
        ] as WordMeaning[],
        difficulty: 'easy' as StoryDifficulty
    };

    beforeEach(() => {
        mockPrint.mockClear();
        mockWindowOpen.mockClear();
        mockWindowOpen.mockReturnValue(mockPrintWindow);
        mockPrintWindow.document.write.mockClear();
        mockPrintWindow.addEventListener.mockClear();
        mockPrintWindow.print.mockClear();
    });

    describe('FR-033: 프린트용 형식 출력', () => {
        test('프린트 버튼이 렌더링되어야 한다', () => {
            render(<PrintButton story={mockStory} />);

            const printButton = screen.getByRole('button', { name: /프린트/i });
            expect(printButton).toBeInTheDocument();
        });

        test('프린트 버튼 클릭 시 window.open이 호출되어야 한다', async () => {
            render(<PrintButton story={mockStory} />);

            const printButton = screen.getByRole('button', { name: /프린트/i });

            await act(async () => {
                fireEvent.click(printButton);
            });

            expect(mockWindowOpen).toHaveBeenCalledWith('', '_blank');
        });
    });

    describe('FR-034: 프린트 출력 내용', () => {
        test('프린트 컨텐츠에 필수 정보가 포함되어야 한다', () => {
            const printContent = generatePrintContent(mockStory);

            // 영어 스토리 포함 (키워드 강조 유지)
            expect(printContent).toContain('English Story');
            expect(printContent).toContain('cat');
            expect(printContent).toContain('house');

            // 한국어 번역 포함
            expect(printContent).toContain('Korean Translation');
            expect(printContent).toContain('옛날 옛적에');

            // 단어 목록 포함 - HTML 구조에 맞게 수정
            expect(printContent).toContain('Word List');
            expect(printContent).toContain('<strong>cat</strong> - 고양이');
            expect(printContent).toContain('<strong>house</strong> - 집');

            // 난이도 정보 포함
            expect(printContent).toContain('Difficulty');
            expect(printContent).toContain('easy');

            // 생성 날짜 포함
            expect(printContent).toContain('Creation Date');
        });

        test('입력된 단어가 굵은 글씨체로 강조되어야 한다', () => {
            const printContent = generatePrintContent(mockStory);

            // 프린트용 스타일이 적용된 키워드 확인
            expect(printContent).toContain('class="print-keyword"');
            expect(printContent).toMatch(/<span[^>]*class="print-keyword"[^>]*>cat<\/span>/);
            expect(printContent).toMatch(/<span[^>]*class="print-keyword"[^>]*>house<\/span>/);
        });
    });

    describe('FR-035: A4 용지 최적화', () => {
        test('프린트 CSS가 A4 용지 크기에 맞게 설정되어야 한다', () => {
            const printContent = generatePrintContent(mockStory);

            // A4 용지 크기 CSS 설정 확인
            expect(printContent).toContain('@page');
            expect(printContent).toContain('size: A4');
            expect(printContent).toContain('margin: 2cm');
        });
    });

    describe('FR-036: UI 요소 제외', () => {
        test('프린트 시 불필요한 UI 요소가 숨겨져야 한다', () => {
            const printContent = generatePrintContent(mockStory);

            // 프린트 시 숨겨질 요소들의 CSS 클래스 확인 - 실제 구조에 맞게 수정
            expect(printContent).toContain('.no-print, .print-hide {');
            expect(printContent).toContain('display: none !important;');
        });
    });

    describe('FR-037: 단어 강조 스타일', () => {
        test('프린트용 키워드 강조 스타일이 적용되어야 한다', () => {
            const printContent = generatePrintContent(mockStory);

            // 프린트용 키워드 스타일 확인
            expect(printContent).toContain('.print-keyword');
            expect(printContent).toContain('font-weight: bold');
            expect(printContent).toContain('text-decoration: underline');
        });
    });

    describe('FR-038: 흑백 프린터 호환성', () => {
        test('프린트 시 색상이 텍스트 스타일로 변환되어야 한다', () => {
            const printContent = generatePrintContent(mockStory);

            // 색상을 텍스트 스타일로 변환하는 CSS 확인
            expect(printContent).toContain('color: black !important');
            expect(printContent).toContain('background-color: transparent !important');
        });

        test('HTML 태그의 색상이 제거되고 스타일로 대체되어야 한다', () => {
            const cleanedText = cleanTextForPrint(mockStory.englishStory, mockStory.usedWords);

            // 원본에는 색상 스타일이 있지만, 정리된 텍스트에는 프린트용 클래스만 있어야 함
            expect(mockStory.englishStory).toContain('color: #dc2626');
            expect(cleanedText).not.toContain('color: #dc2626');
            expect(cleanedText).toContain('class="print-keyword"');
        });
    });

    describe('유틸리티 함수 테스트', () => {
        test('날짜 포맷팅이 올바르게 동작해야 한다', () => {
            const testDate = new Date('2024-03-15T10:30:00');
            const formattedDate = formatDateForPrint(testDate);

            expect(formattedDate).toBe('2024-03-15 10:30');
        });

        test('텍스트 정리 함수가 HTML 태그를 프린트용으로 변환해야 한다', () => {
            const htmlText = 'This is a <span style="color: red;">test</span> text.';
            const words: WordMeaning[] = [{ englishWord: 'test', koreanMeaning: '테스트' }];

            const cleanedText = cleanTextForPrint(htmlText, words);

            // HTML 태그가 프린트용 클래스로 변환되어야 함
            expect(cleanedText).not.toContain('style="color: red;"');
            expect(cleanedText).toContain('class="print-keyword"');
        });
    });

    describe('에러 처리', () => {
        test('빈 스토리에 대해 적절히 처리해야 한다', () => {
            const emptyStory = {
                englishStory: '',
                koreanTranslation: '',
                usedWords: [],
                difficulty: 'easy' as StoryDifficulty
            };

            expect(() => {
                generatePrintContent(emptyStory);
            }).not.toThrow();
        });

        test('프린트 함수가 브라우저에서 지원되지 않을 때 적절히 처리해야 한다', async () => {
            // window.open을 null로 설정하여 실패 상황 시뮬레이션
            mockWindowOpen.mockReturnValue(null);

            render(<PrintButton story={mockStory} />);

            const printButton = screen.getByRole('button', { name: /프린트/i });

            // 에러 없이 처리되어야 함 (fallback 메커니즘 동작)
            await act(async () => {
                fireEvent.click(printButton);
            });

            // fallback으로 window.print가 호출되어야 함
            expect(mockPrint).toHaveBeenCalled();
        });
    });
});
