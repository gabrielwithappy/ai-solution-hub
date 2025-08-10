import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExcelPreviewModal from './ExcelPreviewModal';
import { ExcelImportData } from '../lib/excel-import-utils';

describe('ExcelPreviewModal', () => {
    const mockData: ExcelImportData[] = [
        { englishWord: 'apple', koreanMeaning: '사과' },
        { englishWord: 'banana', koreanMeaning: '바나나' },
        { englishWord: 'cherry', koreanMeaning: '체리' },
    ];

    const mockOnConfirm = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render preview modal with data', () => {
        // When
        render(
            <ExcelPreviewModal
                isOpen={true}
                data={mockData}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        // Then
        expect(screen.getByText(/Excel 파일 미리보기/)).toBeInTheDocument();
        expect(screen.getByText('apple')).toBeInTheDocument();
        expect(screen.getByText('사과')).toBeInTheDocument();
        expect(screen.getByText('banana')).toBeInTheDocument();
        expect(screen.getByText('바나나')).toBeInTheDocument();
        expect(screen.getByText('cherry')).toBeInTheDocument();
        expect(screen.getByText('체리')).toBeInTheDocument();
        expect(screen.getByText('인식된 데이터')).toBeInTheDocument();
    });

    it('should show warnings when provided', () => {
        // Given
        const warnings = [
            '중복된 영어 단어가 발견되었습니다: apple',
            '특수문자나 이모지가 포함된 단어: hello@world'
        ];

        // When
        render(
            <ExcelPreviewModal
                isOpen={true}
                data={mockData}
                warnings={warnings}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        // Then
        expect(screen.getByText(/주의사항/)).toBeInTheDocument();
        expect(screen.getByText('중복된 영어 단어가 발견되었습니다: apple')).toBeInTheDocument();
        expect(screen.getByText('특수문자나 이모지가 포함된 단어: hello@world')).toBeInTheDocument();
    });

    it('should call onConfirm when confirm button is clicked', () => {
        // Given
        render(
            <ExcelPreviewModal
                isOpen={true}
                data={mockData}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        // When
        fireEvent.click(screen.getByText('확인'));

        // Then
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', () => {
        // Given
        render(
            <ExcelPreviewModal
                isOpen={true}
                data={mockData}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        // When
        fireEvent.click(screen.getByText('취소'));

        // Then
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when overlay is clicked', () => {
        // Given
        render(
            <ExcelPreviewModal
                isOpen={true}
                data={mockData}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        // When
        fireEvent.click(screen.getByTestId('modal-overlay'));

        // Then
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should not render when isOpen is false', () => {
        // When
        render(
            <ExcelPreviewModal
                isOpen={false}
                data={mockData}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        // Then
        expect(screen.queryByText(/Excel 파일 미리보기/)).not.toBeInTheDocument();
    });

    it('should handle empty data', () => {
        // When
        render(
            <ExcelPreviewModal
                isOpen={true}
                data={[]}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        // Then
        expect(screen.getByText(/인식된 데이터가 없습니다/)).toBeInTheDocument();
        expect(screen.getByText('인식된 데이터')).toBeInTheDocument();
    });

    it('should show 20 word limit warning', () => {
        // Given
        const manyWords = Array.from({ length: 22 }, (_, i) => ({
            englishWord: `word${i + 1}`,
            koreanMeaning: `의미${i + 1}`
        }));

        // When
        render(
            <ExcelPreviewModal
                isOpen={true}
                data={manyWords.slice(0, 20)} // Only first 20 are passed
                warnings={['20개를 초과하는 단어가 있어 처음 20개만 처리됩니다.']}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        // Then
        expect(screen.getByText('20개를 초과하는 단어가 있어 처음 20개만 처리됩니다.')).toBeInTheDocument();
        expect(screen.getByText('인식된 데이터')).toBeInTheDocument();
    });

    it('should handle keyboard navigation', () => {
        // Given
        render(
            <ExcelPreviewModal
                isOpen={true}
                data={mockData}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        // When - Press Escape key
        fireEvent.keyDown(document, { key: 'Escape' });

        // Then
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should display table headers correctly', () => {
        // When
        render(
            <ExcelPreviewModal
                isOpen={true}
                data={mockData}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        // Then
        expect(screen.getByText('번호')).toBeInTheDocument();
        expect(screen.getByText('영어 단어')).toBeInTheDocument();
        expect(screen.getByText('한국어 의미')).toBeInTheDocument();
    });

    it('should display row numbers correctly', () => {
        // When
        render(
            <ExcelPreviewModal
                isOpen={true}
                data={mockData}
                onConfirm={mockOnConfirm}
                onCancel={mockOnCancel}
            />
        );

        // Then
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });
});
