// 여러 의미 입력 테스트
import { validateWordMeanings, generatePrompt } from '../src/lib/english-story';

// 방법 1: 세미콜론으로 구분
const multiMeaningWords1 = [
    { englishWord: "bank", koreanMeaning: "n.은행; 강둑; 저축" },
    { englishWord: "run", koreanMeaning: "v.달리다; 운영하다; 흐르다" }
];

// 방법 2: 쉼표로 구분  
const multiMeaningWords2 = [
    { englishWord: "bank", koreanMeaning: "은행, 강둑, 저축" },
    { englishWord: "run", koreanMeaning: "달리다, 운영하다, 흐르다" }
];

// 방법 3: 슬래시로 구분
const multiMeaningWords3 = [
    { englishWord: "bank", koreanMeaning: "은행/강둑/저축" },
    { englishWord: "run", koreanMeaning: "달리다/운영하다/흐르다" }
];

console.log('=== 여러 의미 입력 방법 테스트 ===');

try {
    validateWordMeanings(multiMeaningWords1);
    console.log('✅ 방법 1 (세미콜론): 검증 통과');
    const prompt1 = generatePrompt(multiMeaningWords1, 'medium');
    console.log('생성된 프롬프트 일부:', prompt1.substring(0, 200) + '...');
} catch (error) {
    console.log('❌ 방법 1 (세미콜론): 검증 실패', error.message);
}

try {
    validateWordMeanings(multiMeaningWords2);
    console.log('✅ 방법 2 (쉼표): 검증 통과');
} catch (error) {
    console.log('❌ 방법 2 (쉼표): 검증 실패', error.message);
}

try {
    validateWordMeanings(multiMeaningWords3);
    console.log('✅ 방법 3 (슬래시): 검증 통과');
} catch (error) {
    console.log('❌ 방법 3 (슬래시): 검증 실패', error.message);
}
