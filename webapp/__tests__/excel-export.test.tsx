/**
 * Excel 내보내기 기능 테스트
 * 요구사항: FR-039 ~ FR-042
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExcelExportButton } from '@/components/ExcelExportButton';
import { generateExcelData, formatExcelDate } from '@/lib/excel-utils';
import { WordMeaning, StoryDifficulty } from '@/lib/english-story.types';

// Mock file-saver
jest.mock('file-saver', () => ({
    saveAs: jest.fn(),
}));

// Mock xlsx
jest.mock('xlsx', () => ({
    utils: {
        json_to_sheet: jest.fn().mockReturnValue({ mock: 'worksheet' }),
        book_new: jest.fn().mockReturnValue({ mock: 'workbook' }),
        book_append_sheet: jest.fn(),
    },
    write: jest.fn().mockReturnValue('mock-buffer'),
}));

import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const mockSaveAs = saveAs as jest.MockedFunction<typeof saveAs>;
const mockXLSX = XLSX as jest.Mocked<typeof XLSX>;

describe('Excel 내보내기 기능 테스트', () => {
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
        jest.clearAllMocks();
    });

    describe('FR-039: Excel 파일 내보내기', () => {
        test('Excel 내보내기 버튼이 렌더링되어야 한다', () => {
            render(<ExcelExportButton story={mockStory} />);

            const exportButton = screen.getByRole('button', { name: /excel 내보내기/i });
            expect(exportButton).toBeInTheDocument();
        });

        test('빈 단어 목록에 대해 버튼이 비활성화되어야 한다', () => {
            const emptyStory = {
                ...mockStory,
                usedWords: []
            };

            render(<ExcelExportButton story={emptyStory} />);

            const exportButton = screen.getByRole('button', { name: /excel 내보내기/i });
            expect(exportButton).toBeDisabled();
        });
    });

    describe('FR-040: Excel 파일 구조', () => {
        test('Excel 데이터에 필수 열이 포함되어야 한다', () => {
            const excelData = generateExcelData(mockStory);

            // 헤더 확인
            expect(excelData[0]).toEqual({
                'English Word': 'English Word',
                'Korean Meaning': 'Korean Meaning',
                'Story Title': 'Story Title',
                'Creation Date': 'Creation Date'
            });

            // 데이터 행 확인
            expect(excelData[1]).toEqual({
                'English Word': 'cat',
                'Korean Meaning': '고양이',
                'Story Title': 'Generated English Story',
                'Creation Date': expect.any(String)
            });

            expect(excelData[2]).toEqual({
                'English Word': 'house',
                'Korean Meaning': '집',
                'Story Title': 'Generated English Story',
                'Creation Date': expect.any(String)
            });
        });

        test('생성 날짜가 올바른 형식으로 포함되어야 한다', () => {
            const excelData = generateExcelData(mockStory);
            const datePattern = /^\d{4}-\d{2}-\d{2}$/;

            expect(excelData[1]['Creation Date']).toMatch(datePattern);
            expect(excelData[2]['Creation Date']).toMatch(datePattern);
        });
    });

    describe('FR-041: Excel 파일명 형식', () => {
        test('파일명이 올바른 형식으로 생성되어야 한다', async () => {
            const testDate = new Date('2024-03-15');
            const expectedFilename = 'english-words-2024-03-15.xlsx';

            // Mock Date.now to return fixed date
            const originalDate = Date;
            global.Date = jest.fn(() => testDate) as any;
            global.Date.now = jest.fn(() => testDate.getTime());

            render(<ExcelExportButton story={mockStory} />);

            const exportButton = screen.getByRole('button', { name: /excel 내보내기/i });

            await act(async () => {
                fireEvent.click(exportButton);
            });

            const saveAsCall = mockSaveAs.mock.calls[0];
            expect(saveAsCall[1]).toBe(expectedFilename);

            // Restore original Date
            global.Date = originalDate;
        });
    });

    describe('FR-042: 브라우저 다운로드', () => {
        test('file-saver를 통해 브라우저 다운로드가 실행되어야 한다', async () => {
            render(<ExcelExportButton story={mockStory} />);

            const exportButton = screen.getByRole('button', { name: /excel 내보내기/i });

            await act(async () => {
                fireEvent.click(exportButton);
            });

            expect(mockSaveAs).toHaveBeenCalledWith(
                expect.any(Blob),
                expect.stringMatching(/^english-words-\d{4}-\d{2}-\d{2}\.xlsx$/)
            );
        });

        test('생성된 Blob이 올바른 MIME 타입을 가져야 한다', async () => {
            render(<ExcelExportButton story={mockStory} />);

            const exportButton = screen.getByRole('button', { name: /excel 내보내기/i });

            await act(async () => {
                fireEvent.click(exportButton);
            });

            const saveAsCall = mockSaveAs.mock.calls[0];
            const blob = saveAsCall[0];

            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        });
    });

    describe('유틸리티 함수 테스트', () => {
        test('날짜 포맷팅이 올바르게 동작해야 한다', () => {
            const testDate = new Date('2024-03-15T10:30:00');
            const formattedDate = formatExcelDate(testDate);

            expect(formattedDate).toBe('2024-03-15');
        });

        test('빈 단어 목록에 대해 적절히 처리해야 한다', () => {
            const emptyStory = {
                ...mockStory,
                usedWords: []
            };

            const excelData = generateExcelData(emptyStory);

            // 헤더만 있어야 함
            expect(excelData).toHaveLength(1);
            expect(excelData[0]).toEqual({
                'English Word': 'English Word',
                'Korean Meaning': 'Korean Meaning',
                'Story Title': 'Story Title',
                'Creation Date': 'Creation Date'
            });
        });

        test('Excel 파일 생성 과정이 올바르게 수행되어야 한다', async () => {
            render(<ExcelExportButton story={mockStory} />);

            const exportButton = screen.getByRole('button', { name: /excel 내보내기/i });

            await act(async () => {
                fireEvent.click(exportButton);
            });

            // XLSX 유틸리티 함수들이 올바른 순서로 호출되었는지 확인
            expect(mockJsonToSheet).toHaveBeenCalledTimes(1);
            expect(mockBookNew).toHaveBeenCalledTimes(1);
            expect(mockBookAppendSheet).toHaveBeenCalledTimes(1);
            expect(mockWrite).toHaveBeenCalledTimes(1);
        });
    });

    describe('에러 처리', () => {
        test('Excel 생성 실패 시 적절히 처리해야 한다', async () => {
            mockWrite.mockImplementationOnce(() => {
                throw new Error('Excel 생성 실패');
            });

            render(<ExcelExportButton story={mockStory} />);

            const exportButton = screen.getByRole('button', { name: /excel 내보내기/i });

            // 에러 없이 처리되어야 함
            await act(async () => {
                fireEvent.click(exportButton);
            });

            // saveAs가 호출되지 않았어야 함
            expect(mockSaveAs).not.toHaveBeenCalled();
        });

        test('빈 단어 목록에 대해 버튼이 비활성화되어야 한다', () => {
            const emptyStory = {
                ...mockStory,
                usedWords: []
            };

            render(<ExcelExportButton story={emptyStory} />);

            const exportButton = screen.getByRole('button', { name: /excel 내보내기/i });
            expect(exportButton).toBeDisabled();
        });
    });
});
