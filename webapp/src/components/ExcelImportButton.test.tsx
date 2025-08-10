import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExcelImportButton from './ExcelImportButton';

// Mock components
jest.mock('./ExcelImportDropzone', () => {
    return function MockExcelImportDropzone({ onImport, onError, onWarning }: any) {
        return (
            <div data-testid="excel-dropzone">
                <button
                    onClick={() => onImport([
                        { englishWord: 'apple', koreanMeaning: '사과' },
                        { englishWord: 'banana', koreanMeaning: '바나나' }
                    ])}
                >
                    Trigger Import
                </button>
                <button onClick={() => onError('Test error')}>
                    Trigger Error
                </button>
                <button onClick={() => onWarning(['Test warning'])}>
                    Trigger Warning
                </button>
            </div>
        );
    };
});

jest.mock('./ExcelPreviewModal', () => {
    return function MockExcelPreviewModal({ isOpen, data, warnings, onConfirm, onCancel }: any) {
        if (!isOpen) return null;
        return (
            <div data-testid="preview-modal">
                <div>Preview: {data.length} items</div>
                {warnings && warnings.length > 0 && (
                    <div>Warnings: {warnings.join(', ')}</div>
                )}
                <button onClick={onConfirm}>Confirm</button>
                <button onClick={onCancel}>Cancel</button>
            </div>
        );
    };
});

describe('ExcelImportButton', () => {
    const mockOnImport = jest.fn();
    const mockOnError = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render Excel import button', () => {
        // When
        render(
            <ExcelImportButton
                onImport={mockOnImport}
                onError={mockOnError}
            />
        );

        // Then
        expect(screen.getByText(/Excel 파일 업로드/)).toBeInTheDocument();
    });

    it('should show dropzone when button is clicked', async () => {
        // Given
        render(
            <ExcelImportButton
                onImport={mockOnImport}
                onError={mockOnError}
            />
        );

        // When
        fireEvent.click(screen.getByText(/Excel 파일 업로드/));

        // Then
        expect(screen.getByTestId('excel-dropzone')).toBeInTheDocument();
    });

    it('should show preview modal when data is imported', async () => {
        // Given
        render(
            <ExcelImportButton
                onImport={mockOnImport}
                onError={mockOnError}
            />
        );

        // Open dropzone
        fireEvent.click(screen.getByText(/Excel 파일 업로드/));

        // When
        fireEvent.click(screen.getByText('Trigger Import'));

        // Then
        await waitFor(() => {
            expect(screen.getByTestId('preview-modal')).toBeInTheDocument();
            expect(screen.getByText('Preview: 2 items')).toBeInTheDocument();
        });
    });

    it('should call onImport when preview is confirmed', async () => {
        // Given
        render(
            <ExcelImportButton
                onImport={mockOnImport}
                onError={mockOnError}
            />
        );

        // Open dropzone and trigger import
        fireEvent.click(screen.getByText(/Excel 파일 업로드/));
        fireEvent.click(screen.getByText('Trigger Import'));

        // When
        await waitFor(() => {
            fireEvent.click(screen.getByText('Confirm'));
        });

        // Then
        expect(mockOnImport).toHaveBeenCalledWith([
            { englishWord: 'apple', koreanMeaning: '사과' },
            { englishWord: 'banana', koreanMeaning: '바나나' }
        ]);
    });

    it('should close modal when preview is cancelled', async () => {
        // Given
        render(
            <ExcelImportButton
                onImport={mockOnImport}
                onError={mockOnError}
            />
        );

        // Open dropzone and trigger import
        fireEvent.click(screen.getByText(/Excel 파일 업로드/));
        fireEvent.click(screen.getByText('Trigger Import'));

        // When
        await waitFor(() => {
            fireEvent.click(screen.getByText('Cancel'));
        });

        // Then
        expect(screen.queryByTestId('preview-modal')).not.toBeInTheDocument();
    });

    it('should show warnings in preview modal', async () => {
        // Given
        render(
            <ExcelImportButton
                onImport={mockOnImport}
                onError={mockOnError}
            />
        );

        // Open dropzone
        fireEvent.click(screen.getByText(/Excel 파일 업로드/));

        // When
        fireEvent.click(screen.getByText('Trigger Warning'));
        fireEvent.click(screen.getByText('Trigger Import'));

        // Then
        await waitFor(() => {
            expect(screen.getByText('Warnings: Test warning')).toBeInTheDocument();
        });
    });

    it('should handle errors from dropzone', async () => {
        // Given
        render(
            <ExcelImportButton
                onImport={mockOnImport}
                onError={mockOnError}
            />
        );

        // Open dropzone
        fireEvent.click(screen.getByText(/Excel 파일 업로드/));

        // When
        fireEvent.click(screen.getByText('Trigger Error'));

        // Then
        expect(mockOnError).toHaveBeenCalledWith('Test error');
    });

    it('should close dropzone when cancelled', async () => {
        // Given
        render(
            <ExcelImportButton
                onImport={mockOnImport}
                onError={mockOnError}
            />
        );

        // Open dropzone
        fireEvent.click(screen.getByText(/Excel 파일 업로드/));
        expect(screen.getByTestId('excel-dropzone')).toBeInTheDocument();

        // When
        fireEvent.click(screen.getByText('취소'));

        // Then
        expect(screen.queryByTestId('excel-dropzone')).not.toBeInTheDocument();
    });

    it('should show success message after import', async () => {
        // Given
        render(
            <ExcelImportButton
                onImport={mockOnImport}
                onError={mockOnError}
            />
        );

        // Open dropzone, import, and confirm
        fireEvent.click(screen.getByText(/Excel 파일 업로드/));
        fireEvent.click(screen.getByText('Trigger Import'));

        await waitFor(() => {
            fireEvent.click(screen.getByText('Confirm'));
        });

        // Then
        await waitFor(() => {
            expect(screen.getByText(/성공적으로 업로드되었습니다/)).toBeInTheDocument();
        });
    });

    it('should be disabled when disabled prop is true', () => {
        // When
        render(
            <ExcelImportButton
                onImport={mockOnImport}
                onError={mockOnError}
                disabled={true}
            />
        );

        // Then
        const button = screen.getByText(/Excel 파일 업로드/);
        expect(button).toBeDisabled();
    });
});
