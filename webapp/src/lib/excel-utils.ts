/**
 * Excel 내보내기 유틸리티
 * 요구사항: FR-039 ~ FR-042
 */

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { StoryResponse } from './english-story.types';

/**
 * 날짜를 Excel용 형식으로 포맷팅
 * @param date 포맷팅할 날짜
 * @returns YYYY-MM-DD 형식의 문자열
 */
export function formatExcelDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * 스토리 데이터를 Excel 형식의 데이터로 변환
 * @param story 스토리 데이터
 * @returns Excel용 데이터 배열
 */
export function generateExcelData(story: StoryResponse): Record<string, string | number>[] {
    const currentDate = formatExcelDate(new Date());
    const storyTitle = 'Generated English Story';

    // 헤더 행
    const headers = {
        'English Word': 'English Word',
        'Korean Meaning': 'Korean Meaning',
        'Story Title': 'Story Title',
        'Creation Date': 'Creation Date'
    };

    // 데이터 행들
    const dataRows = story.usedWords.map(word => ({
        'English Word': word.englishWord,
        'Korean Meaning': word.koreanMeaning,
        'Story Title': storyTitle,
        'Creation Date': currentDate
    }));

    return [headers, ...dataRows];
}

/**
 * Excel 파일명 생성
 * @param date 기준 날짜 (선택사항, 기본값은 현재 날짜)
 * @returns Excel 파일명
 */
export function generateExcelFilename(date?: Date): string {
    const targetDate = date || new Date();
    const dateString = formatExcelDate(targetDate);
    return `english-words-${dateString}.xlsx`;
}

/**
 * 스토리 데이터를 Excel Blob으로 생성
 * @param story 스토리 데이터
 * @returns Excel 파일 Blob
 */
export async function exportStoryToExcel(story: StoryResponse): Promise<Blob> {
    try {
        // Excel 데이터 생성
        const excelData = generateExcelData(story);

        // 워크시트 생성
        const worksheet = XLSX.utils.json_to_sheet(excelData, {
            skipHeader: true  // 첫 번째 행이 이미 헤더이므로 자동 헤더 생성 비활성화
        });

        // 워크북 생성
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'English Words');

        // 컬럼 너비 설정
        worksheet['!cols'] = [
            { width: 20 }, // English Word
            { width: 20 }, // Korean Meaning
            { width: 25 }, // Story Title
            { width: 15 }  // Creation Date
        ];

        // Excel 파일 생성
        const excelBuffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array'
        });

        // Blob 생성 및 반환
        const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        return blob;

    } catch (error) {
        console.error('Excel 파일 생성 중 오류 발생:', error);
        throw new Error('Excel 파일을 생성할 수 없습니다.');
    }
}

/**
 * 스토리 데이터를 Excel 파일로 내보내기
 * @param story 스토리 데이터
 */
export async function exportToExcel(story: StoryResponse): Promise<void> {
    try {
        // Excel 데이터 생성
        const excelData = generateExcelData(story);

        // 워크시트 생성
        const worksheet = XLSX.utils.json_to_sheet(excelData, {
            skipHeader: true  // 첫 번째 행이 이미 헤더이므로 자동 헤더 생성 비활성화
        });

        // 워크북 생성
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'English Words');

        // 컬럼 너비 설정
        worksheet['!cols'] = [
            { width: 20 }, // English Word
            { width: 20 }, // Korean Meaning
            { width: 25 }, // Story Title
            { width: 15 }  // Creation Date
        ];

        // Excel 파일 생성
        const excelBuffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array'
        });

        // Blob 생성 및 다운로드
        const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const filename = generateExcelFilename();
        saveAs(blob, filename);

    } catch (error) {
        console.error('Excel 파일 생성 중 오류 발생:', error);
        throw new Error('Excel 파일을 생성할 수 없습니다.');
    }
}

/**
 * Excel 내보내기 지원 여부 확인
 * @returns 지원 여부
 */
export function isExcelExportSupported(): boolean {
    try {
        // 필요한 API들이 존재하는지 확인
        return !!(
            typeof Blob !== 'undefined' &&
            typeof URL !== 'undefined' &&
            typeof URL.createObjectURL === 'function'
        );
    } catch {
        return false;
    }
}
