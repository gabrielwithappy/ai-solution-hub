/**
 * 프린트 기능 유틸리티
 * 요구사항: FR-033 ~ FR-038
 */

import { WordMeaning, StoryDifficulty, StoryResponse } from './english-story.types';

/**
 * 날짜를 프린트용 형식으로 포맷팅
 * @param date 포맷팅할 날짜
 * @returns YYYY-MM-DD HH:mm 형식의 문자열
 */
export function formatDateForPrint(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * HTML 태그를 프린트용 스타일로 변환
 * @param text HTML 태그가 포함된 텍스트
 * @param words 강조할 단어 목록
 * @returns 프린트용으로 변환된 텍스트
 */
export function cleanTextForPrint(text: string, words: WordMeaning[]): string {
    let cleanedText = text;

    // 기존 HTML 태그를 제거하고 프린트용 클래스로 대체
    words.forEach(word => {
        const regex = new RegExp(
            `<span[^>]*>${word.englishWord}</span>`,
            'gi'
        );
        cleanedText = cleanedText.replace(
            regex,
            `<span class="print-keyword">${word.englishWord}</span>`
        );
    });

    // 다른 모든 style 속성 제거
    cleanedText = cleanedText.replace(/style="[^"]*"/g, '');

    return cleanedText;
}

/**
 * 프린트용 완전한 HTML 컨텐츠 생성
 * @param story 스토리 데이터
 * @returns 프린트용 HTML 문자열
 */
export function generatePrintContent(story: StoryResponse): string {
    const currentDate = formatDateForPrint(new Date());
    const cleanedStory = cleanTextForPrint(story.englishStory, story.usedWords);

    return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>English Story - Print</title>
      <style>
        @page {
          size: A4;
          margin: 2cm;
        }
        
        @media print {
          body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            color: black !important;
            background-color: white !important;
          }
          
          .no-print, .print-hide {
            display: none !important;
          }
          
          .print-keyword {
            font-weight: bold !important;
            text-decoration: underline !important;
            color: black !important;
            background-color: transparent !important;
          }
          
          .print-section {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          .print-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid black;
            padding-bottom: 5px;
          }
          
          .print-content {
            margin-bottom: 15px;
            text-align: justify;
          }
          
          .word-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 10px;
          }
          
          .word-item {
            padding: 5px;
            border: 1px solid #ccc;
            background-color: #f9f9f9;
          }
          
          .metadata {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid black;
            font-size: 10pt;
          }
        }
        
        @media screen {
          body {
            font-family: Arial, sans-serif;
            max-width: 21cm;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
          }
          
          .print-keyword {
            font-weight: bold;
            text-decoration: underline;
            color: #dc2626;
          }
          
          .print-section {
            margin-bottom: 20px;
          }
          
          .print-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 2px solid #333;
            padding-bottom: 5px;
          }
          
          .print-content {
            margin-bottom: 15px;
            line-height: 1.6;
          }
          
          .word-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 10px;
          }
          
          .word-item {
            padding: 8px;
            border: 1px solid #ddd;
            background-color: #f8f9fa;
            border-radius: 4px;
          }
          
          .metadata {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #333;
            color: #666;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <header class="print-section">
          <h1 style="text-align: center; margin-bottom: 30px;">English Story Learning Material</h1>
        </header>
        
        <section class="print-section">
          <div class="print-title">English Story</div>
          <div class="print-content">${cleanedStory}</div>
        </section>
        
        <section class="print-section">
          <div class="print-title">Korean Translation</div>
          <div class="print-content">${story.koreanTranslation}</div>
        </section>
        
        <section class="print-section">
          <div class="print-title">Word List</div>
          <div class="word-list">
            ${story.usedWords.map(word => `
              <div class="word-item">
                <strong>${word.englishWord}</strong> - ${word.koreanMeaning}
              </div>
            `).join('')}
          </div>
        </section>
        
        <footer class="metadata">
          <div><strong>Difficulty:</strong> ${story.difficulty}</div>
          <div><strong>Creation Date:</strong> ${currentDate}</div>
          <div><strong>Total Words:</strong> ${story.usedWords.length}</div>
        </footer>
      </div>
    </body>
    </html>
  `;
}

/**
 * 프린트 실행 함수
 * @param story 프린트할 스토리 데이터
 */
export function printStory(story: StoryResponse): void {
    try {
        // 새 창에서 프린트 컨텐츠 열기
        const printWindow = window.open('', '_blank');

        if (!printWindow) {
            throw new Error('팝업이 차단되었습니다. 팝업을 허용해주세요.');
        }

        const printContent = generatePrintContent(story);

        printWindow.document.write(printContent);
        printWindow.document.close();

        // 로딩 완료 후 프린트 실행
        printWindow.addEventListener('load', () => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        });

    } catch (error) {
        console.error('프린트 실행 중 오류 발생:', error);

        // 폴백: 현재 페이지에서 프린트
        if (typeof window !== 'undefined' && window.print) {
            window.print();
        } else {
            throw new Error('프린트 기능을 사용할 수 없습니다.');
        }
    }
}

/**
 * 프린트 미리보기 HTML 생성
 * @param story 스토리 데이터
 * @returns 미리보기용 HTML
 */
export function generatePrintPreview(story: StoryResponse): string {
    return generatePrintContent(story);
}
