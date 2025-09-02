// 프롬프트 생성 테스트
const { generatePrompt } = require('./src/lib/english-story.ts');

// "n.테스트" 형태의 입력 테스트
const testWords = [
    { englishWord: "test", koreanMeaning: "n.테스트" },
    { englishWord: "beautiful", koreanMeaning: "adj.아름다운" },
    { englishWord: "run", koreanMeaning: "v.달리다" }
];

const prompt = generatePrompt(testWords, 'medium');
console.log('=== 생성된 프롬프트 ===');
console.log(prompt);
console.log('=== 프롬프트 끝 ===');
