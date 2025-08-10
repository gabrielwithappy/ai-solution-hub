import React, { useState, useCallback, useRef } from 'react';
import { parseExcelFile, validateExcelData, isValidFileType, isValidFileSize, ExcelImportData } from '../lib/excel-import-utils';

interface ExcelImportDropzoneProps {
    onImport: (data: ExcelImportData[]) => void;
    onError: (error: string) => void;
    onWarning?: (warnings: string[]) => void;
    disabled?: boolean;
}

const ExcelImportDropzone: React.FC<ExcelImportDropzoneProps> = ({
    onImport,
    onError,
    onWarning,
    disabled = false
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileProcessing = useCallback(async (file: File) => {
        setIsLoading(true);

        try {
            // 파일 형식 검증 (FR-044, FR-048, FR-055)
            if (!isValidFileType(file)) {
                onError('지원되지 않는 파일 형식입니다. .xlsx 또는 .xls 파일만 업로드 가능합니다.');
                setIsLoading(false);
                return;
            }

            // 파일 크기 검증 (FR-055)
            if (!isValidFileSize(file)) {
                onError('파일 크기가 5MB를 초과합니다.');
                setIsLoading(false);
                return;
            }

            // Excel 파일 파싱 (FR-043, FR-045, FR-046, FR-047)
            const parsedData = await parseExcelFile(file);

            // 데이터 검증 (FR-054, FR-058, FR-059)
            const validationResult = validateExcelData(parsedData);

            if (!validationResult.isValid) {
                onError(validationResult.errors.join('\n'));
                setIsLoading(false);
                return;
            }

            // 경고가 있는 경우 콜백 호출
            if (validationResult.warnings.length > 0 && onWarning) {
                onWarning(validationResult.warnings);
            }

            // 성공 시 데이터 반환 (FR-049)
            onImport(validationResult.data || parsedData);

        } catch (error) {
            onError(error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [onImport, onError, onWarning]);

    // 드래그 앤 드롭 이벤트 핸들러 (FR-051)
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragOver(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Only reset drag state if leaving the main dropzone element
        if (e.target === e.currentTarget) {
            setIsDragOver(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (disabled || isLoading) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileProcessing(files[0]);
        }
    }, [disabled, isLoading, handleFileProcessing]);    // 파일 입력 핸들러
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileProcessing(files[0]);
        }
        // Reset input value to allow same file selection
        e.target.value = '';
    }, [handleFileProcessing]);

    const handleClick = useCallback(() => {
        if (!disabled && !isLoading && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [disabled, isLoading]);

    return (
        <div className="excel-import-container">
            {/* 스키마 가이드 (FR-060) */}
            <div className="schema-guide">
                <h3>📋 Excel 파일 업로드 가이드</h3>
                <div className="guide-content">
                    <div className="guide-item">
                        <span className="guide-label">지원 형식:</span>
                        <span>.xlsx, .xls</span>
                    </div>
                    <div className="guide-item">
                        <span className="guide-label">최대 크기:</span>
                        <span>5MB</span>
                    </div>
                    <div className="guide-item">
                        <span className="guide-label">최대 단어:</span>
                        <span>20개</span>
                    </div>
                    <div className="guide-item">
                        <span className="guide-label">필수 열:</span>
                        <span>A열(English Word), B열(Korean Meaning)</span>
                    </div>
                    <div className="guide-note">
                        💡 첫 번째 행은 헤더로 사용되며, 추가 열이 있어도 무시됩니다.
                    </div>
                </div>
            </div>

            {/* 드롭존 (FR-051) */}
            <div
                data-testid="excel-dropzone"
                className={`dropzone ${isDragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''} ${isLoading ? 'loading' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick();
                    }
                }}
            >
                <input
                    ref={fileInputRef}
                    data-testid="file-input"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={disabled || isLoading}
                    style={{ display: 'none' }}
                />

                <div className="dropzone-content">
                    {isLoading ? (
                        <>
                            <div className="loading-spinner">⏳</div>
                            <p>파일 처리 중...</p>
                        </>
                    ) : (
                        <>
                            <div className="dropzone-icon">📄</div>
                            <h4>Excel 파일을 여기로 끌어다 놓으세요</h4>
                            <p>또는 <button type="button" className="file-select-button">파일 선택</button>을 클릭하세요</p>

                            {isDragOver && (
                                <div className="drag-overlay">
                                    <div className="drag-message">파일을 놓아주세요</div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
        .excel-import-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px;
        }

        .schema-guide {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .schema-guide h3 {
          margin: 0 0 16px 0;
          color: #495057;
          font-size: 18px;
        }

        .guide-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .guide-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .guide-label {
          font-weight: 600;
          color: #6c757d;
          min-width: 80px;
        }

        .guide-note {
          margin-top: 12px;
          padding: 12px;
          background: #e3f2fd;
          border-radius: 4px;
          font-size: 14px;
          color: #1565c0;
        }

        .dropzone {
          position: relative;
          border: 2px dashed #ced4da;
          border-radius: 12px;
          padding: 48px 24px;
          text-align: center;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.3s ease;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dropzone:hover:not(.disabled):not(.loading) {
          border-color: #007bff;
          background: #f8f9ff;
        }

        .dropzone.drag-over {
          border-color: #28a745;
          background: #f0fff4;
          transform: scale(1.02);
        }

        .dropzone.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #f8f9fa;
        }

        .dropzone.loading {
          cursor: wait;
        }

        .dropzone-content {
          width: 100%;
          position: relative;
        }

        .dropzone-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .dropzone h4 {
          margin: 0 0 12px 0;
          color: #495057;
          font-size: 20px;
        }

        .dropzone p {
          margin: 0;
          color: #6c757d;
          font-size: 16px;
        }

        .file-select-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          text-decoration: underline;
        }

        .file-select-button:hover {
          background: #0056b3;
        }

        .loading-spinner {
          font-size: 48px;
          margin-bottom: 16px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .drag-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(40, 167, 69, 0.1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .drag-message {
          background: #28a745;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 18px;
        }

        @media (max-width: 768px) {
          .excel-import-container {
            padding: 16px;
          }
          
          .schema-guide {
            padding: 16px;
          }
          
          .dropzone {
            padding: 32px 16px;
          }
          
          .dropzone h4 {
            font-size: 18px;
          }
          
          .dropzone p {
            font-size: 14px;
          }
        }
      `}</style>
        </div>
    );
};

export default ExcelImportDropzone;
