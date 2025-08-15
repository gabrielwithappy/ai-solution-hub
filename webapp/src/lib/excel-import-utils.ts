import * as XLSX from 'xlsx';

export interface ExcelImportData {
    englishWord: string;
    koreanMeaning: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    data?: ExcelImportData[];
}

const SUPPORTED_FILE_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_WORDS = 10;

/**
 * Excel 파일을 파싱하여 영어 단어와 한국어 의미를 추출합니다.
 * FR-043, FR-044, FR-045, FR-046, FR-047, FR-053, FR-055, FR-056, FR-059
 */
export async function parseExcelFile(file: File): Promise<ExcelImportData[]> {
    // 파일 형식 검증 (FR-044, FR-055)
    if (!SUPPORTED_FILE_TYPES.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        throw new Error('지원되지 않는 파일 형식입니다. .xlsx 또는 .xls 파일만 업로드 가능합니다.');
    }

    // 파일 크기 검증 (FR-055)
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('파일 크기가 5MB를 초과합니다.');
    }

    try {
        // 파일을 ArrayBuffer로 읽기
        const arrayBuffer = await file.arrayBuffer();

        // XLSX로 파일 파싱
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // 첫 번째 시트 가져오기
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // JSON으로 변환 (첫 번째 행을 헤더로 처리 - FR-045)
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rawData.length === 0) {
            return [];
        }

        // 헤더 감지
        const headers = rawData[0] as string[];
        const dataRows = rawData.slice(1);

        // 영어 단어와 한국어 의미 열 인덱스 찾기 (FR-046)
        let englishWordIndex = -1;
        let koreanMeaningIndex = -1;

        // 헤더가 있는 경우 헤더 이름으로 찾기
        if (headers && headers.length > 0) {
            englishWordIndex = headers.findIndex(header =>
                header && (
                    header.toLowerCase().includes('english') ||
                    header.toLowerCase().includes('word') ||
                    header === 'A'
                )
            );
            koreanMeaningIndex = headers.findIndex(header =>
                header && (
                    header.toLowerCase().includes('korean') ||
                    header.toLowerCase().includes('meaning') ||
                    header === 'B'
                )
            );
        }

        // 헤더로 찾지 못한 경우 기본 A, B 열 사용
        if (englishWordIndex === -1) englishWordIndex = 0;
        if (koreanMeaningIndex === -1) koreanMeaningIndex = 1;

        const result: ExcelImportData[] = [];

        // 데이터 처리 (FR-047, FR-053, FR-059)
        for (const row of dataRows) {
            if (!Array.isArray(row)) continue;

            const englishWord = row[englishWordIndex]?.toString().trim() || '';
            const koreanMeaning = row[koreanMeaningIndex]?.toString().trim() || '';

            // 빈 행 건너뛰기 (FR-053)
            if (!englishWord || !koreanMeaning) {
                continue;
            }

            result.push({
                englishWord,
                koreanMeaning
            });

            // 최대 10개 제한 (FR-047, FR-059)
            if (result.length >= MAX_WORDS) {
                break;
            }
        }

        return result;

    } catch (error) {
        throw new Error(`Excel 파일 파싱 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
}

/**
 * 파싱된 Excel 데이터의 유효성을 검증합니다.
 * FR-054, FR-058, FR-059
 */
export function validateExcelData(data: ExcelImportData[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 빈 데이터 검사
    if (data.length === 0) {
        errors.push('업로드된 파일에 유효한 데이터가 없습니다.');
        return { isValid: false, errors, warnings };
    }

    // 10개 초과 검사 (FR-059)
    if (data.length > MAX_WORDS) {
        warnings.push('10개를 초과하는 단어가 있어 처음 10개만 처리됩니다.');
        data = data.slice(0, MAX_WORDS);
    }

    // 중복 단어 검사 (FR-054)
    const englishWords = data.map(item => item.englishWord.toLowerCase());
    const duplicates = englishWords.filter((word, index) =>
        englishWords.indexOf(word) !== index
    );

    if (duplicates.length > 0) {
        const uniqueDuplicates = [...new Set(duplicates)];
        uniqueDuplicates.forEach(word => {
            warnings.push(`중복된 영어 단어가 발견되었습니다: ${word}`);
        });
    }

    // 특수문자/이모지 검사 (FR-058)
    const specialCharPattern = /[^a-zA-Z\s'-]/;
    data.forEach(item => {
        if (specialCharPattern.test(item.englishWord)) {
            warnings.push(`특수문자나 이모지가 포함된 단어: ${item.englishWord}`);
        }
    });

    return {
        isValid: true,
        errors,
        warnings,
        data: data.slice(0, MAX_WORDS)
    };
}

/**
 * 파일 형식이 지원되는지 확인합니다.
 */
export function isValidFileType(file: File): boolean {
    return SUPPORTED_FILE_TYPES.includes(file.type) ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls');
}

/**
 * 파일 크기가 제한 내인지 확인합니다.
 */
export function isValidFileSize(file: File): boolean {
    return file.size <= MAX_FILE_SIZE;
}
