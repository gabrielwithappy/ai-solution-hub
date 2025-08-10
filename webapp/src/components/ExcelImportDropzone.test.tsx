import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExcelImportDropzone from './ExcelImportDropzone';

// Mock the excel import utils
jest.mock('../lib/excel-import-utils', () => ({
    parseExcelFile: jest.fn(),
    validateExcelData: jest.fn(),
    isValidFileType: jest.fn(),
    isValidFileSize: jest.fn(),
}));

import { parseExcelFile, validateExcelData, isValidFileType, isValidFileSize } from '../lib/excel-import-utils';

const mockParseExcelFile = parseExcelFile as jest.MockedFunction<typeof parseExcelFile>;
const mockValidateExcelData = validateExcelData as jest.MockedFunction<typeof validateExcelData>;
const mockIsValidFileType = isValidFileType as jest.MockedFunction<typeof isValidFileType>;
const mockIsValidFileSize = isValidFileSize as jest.MockedFunction<typeof isValidFileSize>;

describe('ExcelImportDropzone', () => {
    const mockOnImport = jest.fn();
    const mockOnError = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render dropzone with schema guide', () => {
        // When
        render(
            <ExcelImportDropzone
                onImport={mockOnImport}
                onError={mockOnError}
            />
        );

        // Then
        expect(screen.getByText(/Excel 파일을 여기로 끌어다 놓으세요/)).toBeInTheDocument();
        expect(screen.getByText('.xlsx, .xls')).toBeInTheDocument();
        expect(screen.getByText('5MB')).toBeInTheDocument();
        expect(screen.getByText('20개')).toBeInTheDocument();
        expect(screen.getByText('A열(English Word), B열(Korean Meaning)')).toBeInTheDocument();
    });

    it('should handle file selection via input', async () => {
        // Given
        const mockFile = new File([''], 'test.xlsx', {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const mockData = [
            { englishWord: 'apple', koreanMeaning: '사과' },
            { englishWord: 'banana', koreanMeaning: '바나나' },
        ];

        mockIsValidFileType.mockReturnValue(true);
        mockIsValidFileSize.mockReturnValue(true);
        mockParseExcelFile.mockResolvedValue(mockData);
        mockValidateExcelData.mockReturnValue({
            isValid: true,
            errors: [],
            warnings: [],
            data: mockData
        });

        render(
            <ExcelImportDropzone
                onImport={mockOnImport}
                onError={mockOnError}
            />
        );

        // When
        const hiddenInput = screen.getByTestId('file-input');
        await userEvent.upload(hiddenInput, mockFile);

        // Then
        await waitFor(() => {
            expect(mockParseExcelFile).toHaveBeenCalledWith(mockFile);
            expect(mockOnImport).toHaveBeenCalledWith(mockData);
        });
    });

    it('should handle drag and drop', async () => {
        // Given
        const mockFile = new File([''], 'test.xlsx', {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const mockData = [
            { englishWord: 'apple', koreanMeaning: '사과' },
        ];

        mockIsValidFileType.mockReturnValue(true);
        mockIsValidFileSize.mockReturnValue(true);
        mockParseExcelFile.mockResolvedValue(mockData);
        mockValidateExcelData.mockReturnValue({
            isValid: true,
            errors: [],
            warnings: [],
            data: mockData
        });

        render(
            <ExcelImportDropzone
                onImport={mockOnImport}
                onError={mockOnError}
            />
        );

        const dropzone = screen.getByTestId('excel-dropzone');

        // When - Drag enter
        fireEvent.dragEnter(dropzone, {
            dataTransfer: {
                files: [mockFile],
                types: ['Files']
            }
        });

        // Then - Should show drag over state
        expect(dropzone).toHaveClass('drag-over');

        // When - Drop
        fireEvent.drop(dropzone, {
            dataTransfer: {
                files: [mockFile],
                types: ['Files']
            }
        });

        // Then
        await waitFor(() => {
            expect(mockParseExcelFile).toHaveBeenCalledWith(mockFile);
            expect(mockOnImport).toHaveBeenCalledWith(mockData);
        });
    });

    it('should show drag over state when file is dragged over', () => {
        // Given
        const mockFile = new File([''], 'test.xlsx', {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        render(
            <ExcelImportDropzone
                onImport={mockOnImport}
                onError={mockOnError}
            />
        );

        const dropzone = screen.getByTestId('excel-dropzone');

        // When
        fireEvent.dragEnter(dropzone, {
            dataTransfer: {
                files: [mockFile],
                types: ['Files']
            }
        });

        // Then
        expect(dropzone).toHaveClass('drag-over');

        // When - Drag leave
        fireEvent.dragLeave(dropzone);

        // Then
        expect(dropzone).not.toHaveClass('drag-over');
    });

    it('should handle invalid file type error', async () => {
        // Given
        const mockFile = new File([''], 'test.txt', { type: 'text/plain' });

        mockIsValidFileType.mockReturnValue(false);

        render(
            <ExcelImportDropzone
                onImport={mockOnImport}
                onError={mockOnError}
            />
        );

        const hiddenInput = screen.getByTestId('file-input');

        // When - directly trigger change event
        Object.defineProperty(hiddenInput, 'files', {
            value: [mockFile],
            writable: false,
        });

        fireEvent.change(hiddenInput);

        // Then
        await waitFor(() => {
            expect(mockOnError).toHaveBeenCalledWith('지원되지 않는 파일 형식입니다. .xlsx 또는 .xls 파일만 업로드 가능합니다.');
        });
    });

    it('should handle file size error', async () => {
        // Given
        const mockFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.xlsx', {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        mockIsValidFileType.mockReturnValue(true);
        mockIsValidFileSize.mockReturnValue(false);

        render(
            <ExcelImportDropzone
                onImport={mockOnImport}
                onError={mockOnError}
            />
        );

        const hiddenInput = screen.getByTestId('file-input');

        // When
        await userEvent.upload(hiddenInput, mockFile);

        // Then
        await waitFor(() => {
            expect(mockOnError).toHaveBeenCalledWith('파일 크기가 5MB를 초과합니다.');
        });
    });

    it('should show loading state during file processing', async () => {
        // Given
        const mockFile = new File([''], 'test.xlsx', {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        mockIsValidFileType.mockReturnValue(true);
        mockIsValidFileSize.mockReturnValue(true);
        // Make parseExcelFile hang to test loading state
        mockParseExcelFile.mockImplementation(() => new Promise(() => { }));

        render(
            <ExcelImportDropzone
                onImport={mockOnImport}
                onError={mockOnError}
            />
        );

        const hiddenInput = screen.getByTestId('file-input');

        // When
        await userEvent.upload(hiddenInput, mockFile);

        // Then
        await waitFor(() => {
            expect(screen.getByText(/파일 처리 중.../)).toBeInTheDocument();
        });
    });

    it('should handle validation warnings', async () => {
        // Given
        const mockFile = new File([''], 'test.xlsx', {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const mockData = [
            { englishWord: 'apple', koreanMeaning: '사과' },
            { englishWord: 'apple', koreanMeaning: '다른 사과' },
        ];

        mockIsValidFileType.mockReturnValue(true);
        mockIsValidFileSize.mockReturnValue(true);
        mockParseExcelFile.mockResolvedValue(mockData);
        mockValidateExcelData.mockReturnValue({
            isValid: true,
            errors: [],
            warnings: ['중복된 영어 단어가 발견되었습니다: apple'],
            data: mockData
        });

        const mockOnWarning = jest.fn();

        render(
            <ExcelImportDropzone
                onImport={mockOnImport}
                onError={mockOnError}
                onWarning={mockOnWarning}
            />
        );

        const hiddenInput = screen.getByTestId('file-input');

        // When
        await userEvent.upload(hiddenInput, mockFile);

        // Then
        await waitFor(() => {
            expect(mockOnWarning).toHaveBeenCalledWith(['중복된 영어 단어가 발견되었습니다: apple']);
            expect(mockOnImport).toHaveBeenCalledWith(mockData);
        });
    });

    it('should prevent default drag behaviors', () => {
        // Given
        render(
            <ExcelImportDropzone
                onImport={mockOnImport}
                onError={mockOnError}
            />
        );

        const dropzone = screen.getByTestId('excel-dropzone');

        // When & Then
        const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true });
        const preventDefaultSpy = jest.spyOn(dragOverEvent, 'preventDefault');

        fireEvent(dropzone, dragOverEvent);
        expect(preventDefaultSpy).toHaveBeenCalled();
    });
});
