import React, { useEffect } from 'react';
import { ExcelImportData } from '../lib/excel-import-utils';

interface ExcelPreviewModalProps {
    isOpen: boolean;
    data: ExcelImportData[];
    warnings?: string[];
    onConfirm: () => void;
    onCancel: () => void;
}

const ExcelPreviewModal: React.FC<ExcelPreviewModalProps> = ({
    isOpen,
    data,
    warnings = [],
    onConfirm,
    onCancel
}) => {
    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onCancel();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onCancel]);

    // 모달이 열려있을 때 body 스크롤 막기
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div className="modal-overlay" data-testid="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content" role="dialog" aria-labelledby="modal-title" aria-modal="true">
                <div className="modal-header">
                    <h2 id="modal-title">📋 Excel 파일 미리보기</h2>
                    <button
                        type="button"
                        className="close-button"
                        onClick={onCancel}
                        aria-label="모달 닫기"
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    {/* 요약 정보 */}
                    <div className="summary-info">
                        <p>총 <strong>{data.length}개</strong>의 단어가 인식되었습니다.</p>
                    </div>

                    {/* 경고 메시지 (FR-054, FR-058, FR-059) */}
                    {warnings.length > 0 && (
                        <div className="warnings-section">
                            <h3>⚠️ 주의사항</h3>
                            <ul className="warnings-list">
                                {warnings.map((warning, index) => (
                                    <li key={index} className="warning-item">
                                        {warning}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 데이터 테이블 (FR-052) */}
                    <div className="data-section">
                        <h3>인식된 데이터</h3>
                        {data.length === 0 ? (
                            <div className="empty-state">
                                <p>인식된 데이터가 없습니다.</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>번호</th>
                                            <th>영어 단어</th>
                                            <th>한국어 의미</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((item, index) => (
                                            <tr key={index}>
                                                <td className="row-number">{index + 1}</td>
                                                <td className="english-word">{item.englishWord}</td>
                                                <td className="korean-meaning">{item.koreanMeaning}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="cancel-button" onClick={onCancel}>
                        취소
                    </button>
                    <button
                        type="button"
                        className="confirm-button"
                        onClick={onConfirm}
                        disabled={data.length === 0}
                    >
                        확인
                    </button>
                </div>
            </div>

            <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 24px 0 24px;
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 16px;
        }

        .modal-header h2 {
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

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .summary-info {
          background: #e3f2fd;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .summary-info p {
          margin: 0;
          color: #1565c0;
          font-size: 16px;
        }

        .warnings-section {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .warnings-section h3 {
          margin: 0 0 12px 0;
          color: #856404;
          font-size: 18px;
        }

        .warnings-list {
          margin: 0;
          padding-left: 20px;
        }

        .warning-item {
          color: #856404;
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .data-section h3 {
          margin: 0 0 16px 0;
          color: #495057;
          font-size: 18px;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #6c757d;
        }

        .table-container {
          border: 1px solid #dee2e6;
          border-radius: 8px;
          overflow: hidden;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .data-table th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 1px solid #dee2e6;
        }

        .data-table td {
          padding: 12px;
          border-bottom: 1px solid #dee2e6;
          vertical-align: top;
        }

        .data-table tbody tr:last-child td {
          border-bottom: none;
        }

        .data-table tbody tr:hover {
          background-color: #f8f9fa;
        }

        .row-number {
          text-align: center;
          color: #6c757d;
          width: 60px;
        }

        .english-word {
          font-weight: 600;
          color: #007bff;
        }

        .korean-meaning {
          color: #495057;
        }

        .modal-footer {
          display: flex;
          gap: 12px;
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

        .confirm-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.2s;
        }

        .confirm-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .confirm-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
          opacity: 0.6;
        }

        @media (max-width: 768px) {
          .modal-overlay {
            padding: 10px;
          }

          .modal-content {
            max-height: 95vh;
          }

          .modal-header,
          .modal-body,
          .modal-footer {
            padding-left: 16px;
            padding-right: 16px;
          }

          .modal-header h2 {
            font-size: 20px;
          }

          .data-table {
            font-size: 12px;
          }

          .data-table th,
          .data-table td {
            padding: 8px;
          }

          .modal-footer {
            flex-direction: column;
          }

          .cancel-button,
          .confirm-button {
            width: 100%;
          }
        }
      `}</style>
        </div>
    );
};

export default ExcelPreviewModal;
