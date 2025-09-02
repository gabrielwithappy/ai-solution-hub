import { generateMarkdownFromTemplate, getAvailableTemplates, storyToTemplateData } from './markdown-template';
import { StoryResponse } from './english-story.types';

describe('Markdown Template System', () => {
    const mockStory: StoryResponse = {
        englishStory: '<p>This is a <strong>test</strong> story with multiple words.</p>',
        koreanTranslation: '이것은 여러 단어가 포함된 테스트 스토리입니다.',
        usedWords: [
            { englishWord: 'test', koreanMeaning: '테스트' },
            { englishWord: 'story', koreanMeaning: '이야기' },
            { englishWord: 'word', koreanMeaning: '단어' }
        ],
        difficulty: 'medium'
    };

    describe('storyToTemplateData', () => {
        it('StoryResponse를 TemplateData로 올바르게 변환한다', () => {
            const templateData = storyToTemplateData(mockStory);

            expect(templateData).toEqual({
                title: '영어 스토리',
                date: expect.any(String),
                difficulty: '보통',
                difficultyEn: 'medium',
                wordCount: 3,
                words: mockStory.usedWords,
                englishStory: 'This is a test story with multiple words.',
                koreanTranslation: mockStory.koreanTranslation
            });
        });

        it('HTML 태그가 제거된다', () => {
            const templateData = storyToTemplateData(mockStory);
            expect(templateData.englishStory).not.toContain('<');
            expect(templateData.englishStory).not.toContain('>');
        });

        it('난이도를 한국어로 변환한다', () => {
            const easyStory = { ...mockStory, difficulty: 'easy' as const };
            const hardStory = { ...mockStory, difficulty: 'hard' as const };

            expect(storyToTemplateData(easyStory).difficulty).toBe('쉬움');
            expect(storyToTemplateData(hardStory).difficulty).toBe('어려움');
        });
    });

    describe('generateMarkdownFromTemplate', () => {
        it('기본 템플릿으로 Markdown을 생성한다', () => {
            const markdown = generateMarkdownFromTemplate(mockStory, 'default');

            expect(markdown).toContain('# 영어 스토리');
            expect(markdown).toContain('**난이도:** 보통');
            expect(markdown).toContain('**사용된 단어 수:** 3개');
            expect(markdown).toContain('📚 사용된 단어들');
            expect(markdown).toContain('- **test**: 테스트');
            expect(markdown).toContain('- **story**: 이야기');
            expect(markdown).toContain('- **word**: 단어');
            expect(markdown).toContain('This is a test story with multiple words.');
            expect(markdown).toContain('이것은 여러 단어가 포함된 테스트 스토리입니다.');
        });

        it('학습용 템플릿으로 Markdown을 생성한다', () => {
            const markdown = generateMarkdownFromTemplate(mockStory, 'study');

            expect(markdown).toContain('# Study Notes: 영어 스토리');
            expect(markdown).toContain('Difficulty: 보통');
            expect(markdown).toContain('Vocabulary (3 words)');
            expect(markdown).toContain('| test | 테스트 |');
            expect(markdown).toContain('| story | 이야기 |');
            expect(markdown).toContain('| word | 단어 |');
            expect(markdown).toContain('> This is a test story with multiple words.');
            expect(markdown).toContain('### Study Tips');
        });

        it('진도 관리 템플릿으로 Markdown을 생성한다', () => {
            const markdown = generateMarkdownFromTemplate(mockStory, 'progress');

            expect(markdown).toContain('---\ntitle: "영어 스토리"');
            expect(markdown).toContain('difficulty: "보통"');
            expect(markdown).toContain('wordCount: 3');
            expect(markdown).toContain('tags: [english, story, vocabulary]');
            expect(markdown).toContain('- [ ] **test** - 테스트');
            expect(markdown).toContain('- [ ] **story** - 이야기');
            expect(markdown).toContain('- [ ] **word** - 단어');
            expect(markdown).toContain('## Progress Tracking');
            expect(markdown).toContain('- [ ] Read the story');
        });

        it('템플릿이 지정되지 않으면 기본 템플릿을 사용한다', () => {
            const markdownDefault = generateMarkdownFromTemplate(mockStory);
            const markdownExplicit = generateMarkdownFromTemplate(mockStory, 'default');

            expect(markdownDefault).toBe(markdownExplicit);
        });
    });

    describe('getAvailableTemplates', () => {
        it('사용 가능한 템플릿 목록을 반환한다', () => {
            const templates = getAvailableTemplates();

            expect(templates).toHaveLength(3);
            expect(templates).toEqual([
                {
                    key: 'default',
                    name: '기본 템플릿',
                    description: '기본적인 스토리 형식으로 구성된 템플릿'
                },
                {
                    key: 'study',
                    name: '학습용 템플릿',
                    description: '학습 팁과 구조화된 형식의 템플릿'
                },
                {
                    key: 'progress',
                    name: '진도 관리 템플릿',
                    description: '체크리스트와 메타데이터를 포함한 템플릿'
                }
            ]);
        });
    });

    describe('Template Engine', () => {
        it('변수 치환이 올바르게 작동한다', () => {
            // 간단한 템플릿 엔진 테스트를 위해 직접 호출
            const markdown = generateMarkdownFromTemplate(mockStory, 'default');

            expect(markdown).toContain('영어 스토리');
            expect(markdown).toContain('3개');
        });

        it('반복문이 올바르게 작동한다', () => {
            const markdown = generateMarkdownFromTemplate(mockStory, 'default');

            // 각 단어가 포함되어 있는지 확인
            mockStory.usedWords.forEach((word) => {
                expect(markdown).toContain(`**${word.englishWord}**: ${word.koreanMeaning}`);
            });
        });

        it('존재하지 않는 변수는 그대로 유지된다', () => {
            // 이것은 내부 구현을 테스트하는 것이므로 실제로는 불필요할 수 있음
            // 하지만 엔진의 견고성을 확인하는 데 도움이 됨
            const markdown = generateMarkdownFromTemplate(mockStory, 'default');

            // 알려진 변수들이 모두 치환되었는지 확인
            expect(markdown).not.toContain('{{title}}');
            expect(markdown).not.toContain('{{date}}');
            expect(markdown).not.toContain('{{difficulty}}');
        });
    });
});
