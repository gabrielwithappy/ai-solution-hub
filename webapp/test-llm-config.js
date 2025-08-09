// LLM 설정 테스트 스크립트
const { config } = require('dotenv');
config({ path: '.env' });

const {
    getAvailableProviders,
    getPrimaryProvider,
    validateLLMConfig
} = require('./src/lib/llm-config.ts');

console.log('=== LLM 설정 테스트 ===');
console.log('환경변수:');
console.log('- LLM_PROVIDER:', process.env.LLM_PROVIDER);
console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');

console.log('\n설정 결과:');
console.log('- 사용 가능한 프로바이더:', getAvailableProviders());
console.log('- 기본 프로바이더:', getPrimaryProvider());

const validation = validateLLMConfig();
console.log('- 설정 유효성:', validation.isValid);
if (validation.errors.length > 0) {
    console.log('- 에러:', validation.errors);
}
if (validation.warnings.length > 0) {
    console.log('- 경고:', validation.warnings);
}
