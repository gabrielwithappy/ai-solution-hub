import {
    generateEnglishStory,
    WordMeaning,
    StoryDifficulty,
    StoryResponse,
    validateWordMeanings,
    resolveAmbiguousWords,
    generatePrompt
} from './english-story';

describe('영어 단어 기반 스토리 생성 기능', () => {
    describe('데이터 타입 검증', () => {
        test('WordMeaning 타입이 올바르게 정의되어야 한다', () => {
            const wordMeaning: WordMeaning = {
                englishWord: 'apple',
                koreanMeaning: '사과'
            };

            expect(wordMeaning.englishWord).toBe('apple');
            expect(wordMeaning.koreanMeaning).toBe('사과');
        });

        test('StoryDifficulty 타입이 올바르게 정의되어야 한다', () => {
            const difficulties: StoryDifficulty[] = ['easy', 'medium', 'hard'];

            expect(difficulties).toContain('easy');
            expect(difficulties).toContain('medium');
            expect(difficulties).toContain('hard');
        });

        test('StoryResponse 타입이 올바르게 정의되어야 한다', () => {
            const response: StoryResponse = {
                englishStory: 'This is a test story.',
                koreanTranslation: '이것은 테스트 이야기입니다.',
                usedWords: [
                    { englishWord: 'test', koreanMeaning: '테스트' }
                ],
                difficulty: 'easy'
            };

            expect(response.englishStory).toBeDefined();
            expect(response.koreanTranslation).toBeDefined();
            expect(response.usedWords).toHaveLength(1);
            expect(response.difficulty).toBe('easy');
        });
    });

    describe('다중 단어 입력 처리', () => {
        test('여러 개의 영어단어-한국어 의미 쌍을 입력받을 수 있어야 한다', () => {
            const words: WordMeaning[] = [
                { englishWord: 'cat', koreanMeaning: '고양이' },
                { englishWord: 'dog', koreanMeaning: '개' },
                { englishWord: 'house', koreanMeaning: '집' }
            ];

            expect(words).toHaveLength(3);
            expect(words[0].englishWord).toBe('cat');
            expect(words[1].koreanMeaning).toBe('개');
        });

        test('빈 배열이 입력되면 에러를 발생시켜야 한다', async () => {
            const words: WordMeaning[] = [];

            await expect(generateEnglishStory(words, 'easy')).rejects.toThrow(
                '최소 1개 이상의 단어를 입력해야 합니다.'
            );
        });

        test('단어가 너무 많으면 에러를 발생시켜야 한다', async () => {
            const words: WordMeaning[] = Array.from({ length: 11 }, (_, i) => ({
                englishWord: `word${i}`,
                koreanMeaning: `단어${i}`
            }));

            await expect(generateEnglishStory(words, 'easy')).rejects.toThrow(
                '최대 10개까지의 단어만 입력 가능합니다.'
            );
        });
    });

    describe('다의어 처리', () => {
        test('다의어가 있는 단어의 올바른 의미를 선택해야 한다', () => {
            const ambiguousWords: WordMeaning[] = [
                { englishWord: 'bank', koreanMeaning: '은행' }, // 강둑이 아닌 은행
                { englishWord: 'light', koreanMeaning: '빛' }   // 가벼운이 아닌 빛
            ];

            const resolved = resolveAmbiguousWords(ambiguousWords);

            expect(resolved).toHaveLength(2);
            expect(resolved[0].koreanMeaning).toBe('은행');
            expect(resolved[1].koreanMeaning).toBe('빛');
        });

        test('다의어 해결 시 한국어 의미를 우선시해야 한다', () => {
            const word: WordMeaning = {
                englishWord: 'run',
                koreanMeaning: '달리다'
            };

            const resolved = resolveAmbiguousWords([word]);

            expect(resolved[0].koreanMeaning).toBe('달리다');
            // '운영하다', '흐르다' 등의 다른 의미가 아닌 '달리다'로 해석되어야 함
        });

        test('여러 의미를 세미콜론으로 구분하여 입력할 수 있어야 한다', () => {
            const words: WordMeaning[] = [
                { englishWord: 'bank', koreanMeaning: 'n.은행; 강둑; 저축' },
                { englishWord: 'run', koreanMeaning: 'v.달리다; 운영하다; 흐르다' }
            ];

            expect(() => validateWordMeanings(words)).not.toThrow();

            const resolved = resolveAmbiguousWords(words);
            expect(resolved[0].koreanMeaning).toBe('n.은행; 강둑; 저축');
            expect(resolved[1].koreanMeaning).toBe('v.달리다; 운영하다; 흐르다');
        });

        test('여러 의미를 쉼표로 구분하여 입력할 수 있어야 한다', () => {
            const words: WordMeaning[] = [
                { englishWord: 'bank', koreanMeaning: '은행, 강둑, 저축' },
                { englishWord: 'light', koreanMeaning: 'adj.가벼운, 밝은; n.빛' }
            ];

            expect(() => validateWordMeanings(words)).not.toThrow();

            const resolved = resolveAmbiguousWords(words);
            expect(resolved[0].koreanMeaning).toBe('은행, 강둑, 저축');
            expect(resolved[1].koreanMeaning).toBe('adj.가벼운, 밝은; n.빛');
        });

        test('LLM에게 여러 의미가 포함된 프롬프트가 전달되어야 한다', () => {
            const words: WordMeaning[] = [
                { englishWord: 'bank', koreanMeaning: 'n.은행; 강둑' },
                { englishWord: 'run', koreanMeaning: 'v.달리다; 운영하다' }
            ];

            const prompt = generatePrompt(words, 'medium');

            expect(prompt).toContain('"bank" (n.은행; 강둑)');
            expect(prompt).toContain('"run" (v.달리다; 운영하다)');
            expect(prompt).toContain('품사 표기가 있는 경우 해당 품사로 사용');
        });
    });

    describe('영어 스토리 생성', () => {
        test('입력된 모든 단어가 스토리에 포함되어야 한다', async () => {
            const words: WordMeaning[] = [
                { englishWord: 'cat', koreanMeaning: '고양이' },
                { englishWord: 'happy', koreanMeaning: '행복한' },
                { englishWord: 'garden', koreanMeaning: '정원' }
            ];

            const result = await generateEnglishStory(words, 'easy');

            expect(result.englishStory).toContain('cat');
            expect(result.englishStory).toContain('happy');
            expect(result.englishStory).toContain('garden');
            expect(result.usedWords).toHaveLength(3);
        });

        test('스토리는 논리적이고 자연스러운 흐름을 가져야 한다', async () => {
            const words: WordMeaning[] = [
                { englishWord: 'teacher', koreanMeaning: '선생님' },
                { englishWord: 'student', koreanMeaning: '학생' },
                { englishWord: 'classroom', koreanMeaning: '교실' }
            ];

            const result = await generateEnglishStory(words, 'medium');

            expect(result.englishStory.length).toBeGreaterThan(50);
            expect(result.koreanTranslation.length).toBeGreaterThan(20);

            // 스토리에 완전한 문장이 포함되어야 함
            expect(result.englishStory).toMatch(/[.!?]$/);
        });

        test('한국어 해석이 정확하게 제공되어야 한다', async () => {
            const words: WordMeaning[] = [
                { englishWord: 'book', koreanMeaning: '책' },
                { englishWord: 'read', koreanMeaning: '읽다' }
            ];

            const result = await generateEnglishStory(words, 'easy');

            expect(result.koreanTranslation).toBeDefined();
            expect(result.koreanTranslation.length).toBeGreaterThan(0);
            expect(result.koreanTranslation).toContain('책');
        });
    });

    describe('난이도 선택', () => {
        test('쉬움 난이도는 간단한 어휘와 문장 구조를 사용해야 한다', async () => {
            const words: WordMeaning[] = [
                { englishWord: 'sun', koreanMeaning: '태양' },
                { englishWord: 'warm', koreanMeaning: '따뜻한' }
            ];

            const result = await generateEnglishStory(words, 'easy');

            expect(result.difficulty).toBe('easy');
            // 쉬운 난이도는 짧고 간단한 문장을 가져야 함
            expect(result.englishStory.split('.').length).toBeLessThanOrEqual(5);
        });

        test('보통 난이도는 적절한 복잡성을 가져야 한다', async () => {
            const words: WordMeaning[] = [
                { englishWord: 'adventure', koreanMeaning: '모험' },
                { englishWord: 'discover', koreanMeaning: '발견하다' }
            ];

            const result = await generateEnglishStory(words, 'medium');

            expect(result.difficulty).toBe('medium');
            expect(result.englishStory.length).toBeGreaterThan(100);
        });

        test('어려움 난이도는 복잡한 어휘와 문장 구조를 사용해야 한다', async () => {
            const words: WordMeaning[] = [
                { englishWord: 'philosophy', koreanMeaning: '철학' },
                { englishWord: 'contemplate', koreanMeaning: '숙고하다' }
            ];

            const result = await generateEnglishStory(words, 'hard');

            expect(result.difficulty).toBe('hard');
            expect(result.englishStory.length).toBeGreaterThan(150);
        });
    });

    describe('입력값 검증', () => {
        test('유효하지 않은 난이도가 입력되면 에러를 발생시켜야 한다', async () => {
            const words: WordMeaning[] = [
                { englishWord: 'test', koreanMeaning: '테스트' }
            ];

            await expect(
                generateEnglishStory(words, 'invalid' as StoryDifficulty)
            ).rejects.toThrow('유효하지 않은 난이도입니다.');
        });

        test('빈 문자열이 포함된 단어는 거부되어야 한다', () => {
            const invalidWords: WordMeaning[] = [
                { englishWord: '', koreanMeaning: '테스트' },
                { englishWord: 'test', koreanMeaning: '' }
            ];

            expect(() => validateWordMeanings(invalidWords)).toThrow(
                '영어 단어와 한국어 의미는 모두 입력되어야 합니다.'
            );
        });

        test('영어 단어에 허용되지 않는 특수 문자가 포함된 경우 거부되어야 한다', () => {
            const invalidWords: WordMeaning[] = [
                { englishWord: 'test123', koreanMeaning: '테스트' },
                { englishWord: 'test!', koreanMeaning: '테스트' },
                { englishWord: 'test@', koreanMeaning: '테스트' }
            ];

            expect(() => validateWordMeanings(invalidWords)).toThrow(
                '영어 단어는 알파벳, 공백, 점, 하이픈만 포함해야 합니다.'
            );
        });

        test('영어 단어에 허용되는 특수 문자(점, 하이픈)는 통과되어야 한다', () => {
            const validWords: WordMeaning[] = [
                { englishWord: 'Mr.', koreanMeaning: '씨' },
                { englishWord: 'self-control', koreanMeaning: '자제력' },
                { englishWord: 'twenty-one', koreanMeaning: '스물하나' }
            ];

            expect(() => validateWordMeanings(validWords)).not.toThrow();
        });

        test('한국어 의미에 일반적인 특수 문자가 포함된 경우 통과되어야 한다', () => {
            const validWords: WordMeaning[] = [
                { englishWord: 'test', koreanMeaning: 'n.테스트' },
                { englishWord: 'beautiful', koreanMeaning: 'adj.아름다운' },
                { englishWord: 'run', koreanMeaning: 'v.달리다' },
                { englishWord: 'number', koreanMeaning: '숫자(1,2,3)' },
                { englishWord: 'example', koreanMeaning: '예) 사례' }
            ];

            expect(() => validateWordMeanings(validWords)).not.toThrow();
        });

        test('한국어 의미에 허용되지 않는 특수 문자가 포함된 경우 거부되어야 한다', () => {
            const invalidWords: WordMeaning[] = [
                { englishWord: 'test', koreanMeaning: '테스트@' },
                { englishWord: 'test', koreanMeaning: '테스트#' },
                { englishWord: 'test', koreanMeaning: '테스트$' }
            ];

            expect(() => validateWordMeanings(invalidWords)).toThrow(
                '한국어 의미에 허용되지 않은 특수문자가 포함되어 있습니다.'
            );
        });
    });

    describe('에러 처리', () => {
        test('API 호출 실패 시 적절한 에러 메시지를 반환해야 한다', async () => {
            // 네트워크 오류 시뮬레이션
            const words: WordMeaning[] = [
                { englishWord: 'network-error', koreanMeaning: '네트워크 오류' }
            ];

            await expect(generateEnglishStory(words, 'easy')).rejects.toThrow(
                '스토리 생성 중 오류가 발생했습니다. 다시 시도해 주세요.'
            );
        });

        test('API 응답이 예상 형식과 다를 때 에러를 발생시켜야 한다', async () => {
            const words: WordMeaning[] = [
                { englishWord: 'invalid-response', koreanMeaning: '잘못된 응답' }
            ];

            await expect(generateEnglishStory(words, 'easy')).rejects.toThrow(
                '스토리 생성 응답 형식이 올바르지 않습니다.'
            );
        });
    });

    describe('성능 요구사항', () => {
        test('5초 이내에 결과를 반환해야 한다', async () => {
            const words: WordMeaning[] = [
                { englishWord: 'quick', koreanMeaning: '빠른' },
                { englishWord: 'response', koreanMeaning: '응답' }
            ];

            const startTime = Date.now();
            const result = await generateEnglishStory(words, 'medium');
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(5000);
            expect(result).toBeDefined();
        }, 6000);
    });
});
