import { parseExcelFile, validateExcelData, ExcelImportData } from './excel-import-utils';

// Mock XLSX
jest.mock('xlsx', () => ({
    read: jest.fn(),
    utils: {
        sheet_to_json: jest.fn(),
    },
}));

import * as XLSX from 'xlsx';

// Mock File.arrayBuffer for Node.js environment
Object.defineProperty(File.prototype, 'arrayBuffer', {
    value: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    writable: true,
});

describe('Excel Import Utils', () => {
    const mockRead = XLSX.read as jest.MockedFunction<typeof XLSX.read>;
    const mockSheetToJson = XLSX.utils.sheet_to_json as jest.MockedFunction<typeof XLSX.utils.sheet_to_json>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('parseExcelFile', () => {
        it('should parse Excel file with English Word and Korean Meaning columns', async () => {
            // Given
            const mockFile = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const mockWorkbook = { SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } };

            mockRead.mockReturnValue(mockWorkbook);
            mockSheetToJson.mockReturnValue([
                ['English Word', 'Korean Meaning'],
                ['apple', '사과'],
                ['banana', '바나나'],
            ]);

            // When
            const result = await parseExcelFile(mockFile);

            // Then
            expect(result).toEqual([
                { englishWord: 'apple', koreanMeaning: '사과' },
                { englishWord: 'banana', koreanMeaning: '바나나' },
            ]);
        });

        it('should parse Excel file with A/B column structure', async () => {
            // Given
            const mockFile = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const mockWorkbook = { SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } };

            mockRead.mockReturnValue(mockWorkbook);
            mockSheetToJson.mockReturnValue([
                ['A', 'B'],
                ['apple', '사과'],
                ['banana', '바나나'],
            ]);

            // When
            const result = await parseExcelFile(mockFile);

            // Then
            expect(result).toEqual([
                { englishWord: 'apple', koreanMeaning: '사과' },
                { englishWord: 'banana', koreanMeaning: '바나나' },
            ]);
        });

        it('should skip empty rows', async () => {
            // Given
            const mockFile = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const mockWorkbook = { SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } };

            mockRead.mockReturnValue(mockWorkbook);
            mockSheetToJson.mockReturnValue([
                ['English Word', 'Korean Meaning'],
                ['apple', '사과'],
                ['', ''],
                ['banana', '바나나'],
            ]);

            // When
            const result = await parseExcelFile(mockFile);

            // Then
            expect(result).toEqual([
                { englishWord: 'apple', koreanMeaning: '사과' },
                { englishWord: 'banana', koreanMeaning: '바나나' },
            ]);
        });

        it('should ignore additional columns', async () => {
            // Given
            const mockFile = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const mockWorkbook = { SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } };

            mockRead.mockReturnValue(mockWorkbook);
            mockSheetToJson.mockReturnValue([
                ['English Word', 'Korean Meaning', 'Story Title', 'Creation Date'],
                ['apple', '사과', 'Test Story', '2025-01-01'],
                ['banana', '바나나', 'Test Story', '2025-01-01'],
            ]);

            // When
            const result = await parseExcelFile(mockFile);

            // Then
            expect(result).toEqual([
                { englishWord: 'apple', koreanMeaning: '사과' },
                { englishWord: 'banana', koreanMeaning: '바나나' },
            ]);
        });

        it('should limit to 20 words maximum', async () => {
            // Given
            const mockFile = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const mockWorkbook = { SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } };
            const headers = ['English Word', 'Korean Meaning'];
            const dataRows = Array.from({ length: 25 }, (_, i) => [`word${i + 1}`, `의미${i + 1}`]);

            mockRead.mockReturnValue(mockWorkbook);
            mockSheetToJson.mockReturnValue([headers, ...dataRows]);

            // When
            const result = await parseExcelFile(mockFile);

            // Then
            expect(result).toHaveLength(20);
            expect(result[0]).toEqual({ englishWord: 'word1', koreanMeaning: '의미1' });
            expect(result[19]).toEqual({ englishWord: 'word20', koreanMeaning: '의미20' });
        });

        it('should throw error for unsupported file types', async () => {
            // Given
            const mockFile = new File([''], 'test.txt', { type: 'text/plain' });

            // When & Then
            await expect(parseExcelFile(mockFile)).rejects.toThrow('지원되지 않는 파일 형식입니다. .xlsx 또는 .xls 파일만 업로드 가능합니다.');
        });

        it('should throw error for files exceeding 5MB', async () => {
            // Given
            const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.xlsx', {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            // When & Then
            await expect(parseExcelFile(largeFile)).rejects.toThrow('파일 크기가 5MB를 초과합니다.');
        });
    });

    describe('validateExcelData', () => {
        it('should validate correct Excel data', () => {
            // Given
            const data: ExcelImportData[] = [
                { englishWord: 'apple', koreanMeaning: '사과' },
                { englishWord: 'banana', koreanMeaning: '바나나' },
            ];

            // When
            const result = validateExcelData(data);

            // Then
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
            expect(result.warnings).toEqual([]);
        });

        it('should detect duplicate English words', () => {
            // Given
            const data: ExcelImportData[] = [
                { englishWord: 'apple', koreanMeaning: '사과' },
                { englishWord: 'apple', koreanMeaning: '다른 사과' },
                { englishWord: 'banana', koreanMeaning: '바나나' },
            ];

            // When
            const result = validateExcelData(data);

            // Then
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('중복된 영어 단어가 발견되었습니다: apple');
        });

        it('should detect special characters and emojis', () => {
            // Given
            const data: ExcelImportData[] = [
                { englishWord: 'apple🍎', koreanMeaning: '사과' },
                { englishWord: 'hello@world', koreanMeaning: '안녕' },
            ];

            // When
            const result = validateExcelData(data);

            // Then
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('특수문자나 이모지가 포함된 단어: apple🍎');
            expect(result.warnings).toContain('특수문자나 이모지가 포함된 단어: hello@world');
        });

        it('should return error for empty data', () => {
            // Given
            const data: ExcelImportData[] = [];

            // When
            const result = validateExcelData(data);

            // Then
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('업로드된 파일에 유효한 데이터가 없습니다.');
        });

        it('should return error for data exceeding 20 words', () => {
            // Given
            const data: ExcelImportData[] = Array.from({ length: 25 }, (_, i) => ({
                englishWord: `word${i + 1}`,
                koreanMeaning: `의미${i + 1}`,
            }));

            // When
            const result = validateExcelData(data);

            // Then
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('20개를 초과하는 단어가 있어 처음 20개만 처리됩니다.');
        });
    });
});
