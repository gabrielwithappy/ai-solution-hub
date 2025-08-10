import React, { useState } from 'react';
import ExcelImportDropzone from './ExcelImportDropzone';
import ExcelPreviewModal from './ExcelPreviewModal';
import { ExcelImportData } from '../lib/excel-import-utils';

interface ExcelImportButtonProps {
    onImport: (data: ExcelImportData[]) => void;
    onError: (error: string) => void;
    disabled?: boolean;
    className?: string;
}

const ExcelImportButton: React.FC<ExcelImportButtonProps> = ({
    onImport,
    onError,
    disabled = false,
    className = ''
}) => {
    const [isDropzoneOpen, setIsDropzoneOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState<ExcelImportData[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleOpenDropzone = () => {
        if (!disabled) {
            setIsDropzoneOpen(true);
            setShowSuccess(false);
        }
    };

    const handleCloseDropzone = () => {
        setIsDropzoneOpen(false);
    };

    const handleImportData = (data: ExcelImportData[]) => {
        setPreviewData(data);
        setIsPreviewOpen(true);
    };

    const handleWarnings = (newWarnings: string[]) => {
        setWarnings(newWarnings);
    };

    const handleConfirmImport = () => {
        onImport(previewData);
        setIsPreviewOpen(false);
        setIsDropzoneOpen(false);
        setShowSuccess(true);

        // Hide success message after 3 seconds
        setTimeout(() => {
            setShowSuccess(false);
        }, 3000);
    };

    const handleCancelPreview = () => {
        setIsPreviewOpen(false);
        setPreviewData([]);
        setWarnings([]);
    };

    return (
        <div className={`excel-import-wrapper ${className}`}>
            {/* Import Button */}
            <button
                type="button"
                className={`excel-import-button ${disabled ? 'disabled' : ''}`}
                onClick={handleOpenDropzone}
                disabled={disabled}
            >
                <span className="button-icon">📄</span>
                Excel 파일 업로드
            </button>

            {/* Success Message */}
            {showSuccess && (
                <div className="success-message">
                    ✅ Excel 파일이 성공적으로 업로드되었습니다!
                </div>
            )}

            {/* Dropzone Modal */}
            {isDropzoneOpen && (
                <div className="dropzone-modal">
                    <div className="dropzone-overlay" onClick={handleCloseDropzone} />
                    <div className="dropzone-content">
                        <div className="dropzone-header">
                            <h2>Excel 파일 업로드</h2>
                            <button
                                type="button"
                                className="close-button"
                                onClick={handleCloseDropzone}
                                aria-label="닫기"
                            >
                                ✕
                            </button>
                        </div>
                        <ExcelImportDropzone
                            onImport={handleImportData}
                            onError={onError}
                            onWarning={handleWarnings}
                            disabled={disabled}
                        />
                        <div className="dropzone-footer">
                            <button
                                type="button"
                                className="cancel-button"
                                onClick={handleCloseDropzone}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            <ExcelPreviewModal
                isOpen={isPreviewOpen}
                data={previewData}
                warnings={warnings}
                onConfirm={handleConfirmImport}
                onCancel={handleCancelPreview}
            />

            <style jsx>{`
        .excel-import-wrapper {
          position: relative;
          display: inline-block;
        }

        .excel-import-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #28a745;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(40, 167, 69, 0.1);
        }

        .excel-import-button:hover:not(.disabled) {
          background: #218838;
          box-shadow: 0 2px 4px rgba(40, 167, 69, 0.2);
        }

        .excel-import-button.disabled {
          background: #6c757d;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .button-icon {
          font-size: 16px;
        }

        .success-message {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
          border-radius: 6px;
          padding: 12px;
          margin-top: 8px;
          font-size: 14px;
          font-weight: 500;
          animation: slideDown 0.3s ease;
          z-index: 10;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropzone-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .dropzone-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
        }

        .dropzone-content {
          position: relative;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow: auto;
        }

        .dropzone-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 24px 0 24px;
          border-bottom: 1px solid #e9ecef;
          margin-bottom: 0;
        }

        .dropzone-header h2 {
          margin: 0;
          color: #495057;
          font-size: 24px;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6c757d;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .close-button:hover {
          background-color: #f8f9fa;
          color: #495057;
        }

        .dropzone-footer {
          display: flex;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid #e9ecef;
          background: #f8f9fa;
        }

        .cancel-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.2s;
        }

        .cancel-button:hover {
          background: #5a6268;
        }

        @media (max-width: 768px) {
          .excel-import-button {
            padding: 10px 16px;
            font-size: 14px;
          }

          .button-icon {
            font-size: 16px;
          }

          .dropzone-modal {
            padding: 10px;
          }

          .dropzone-content {
            max-height: 95vh;
          }

          .dropzone-header,
          .dropzone-footer {
            padding-left: 16px;
            padding-right: 16px;
          }

          .dropzone-header h2 {
            font-size: 20px;
          }

          .success-message {
            font-size: 12px;
            padding: 8px;
          }
        }
      `}</style>
        </div>
    );
};

export default ExcelImportButton;
