'use client';

import { useState } from 'react';
import { WordMeaning, StoryDifficulty, StoryResponse } from '@/lib/english-story.types';
import { ExcelImportData } from '@/lib/excel-import-utils';
import { createTTSUtility } from '@/lib/tts';
import { PrintButton } from '@/components/PrintButton';
import { ExcelExportButton } from '@/components/ExcelExportButton';
import ExcelImportButton from '@/components/ExcelImportButton';
import LoadingIndicator from '@/components/ui/LoadingIndicator';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function EnglishStoryPage() {
    const [words, setWords] = useState<WordMeaning[]>([{ englishWord: '', koreanMeaning: '' }]);
    const [difficulty, setDifficulty] = useState<StoryDifficulty>('medium');
    const [story, setStory] = useState<StoryResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTranslation, setShowTranslation] = useState(false);

    // TTS 유틸리티 초기화
    const ttsUtility = createTTSUtility();

    // HTML 태그 제거 함수
    const stripHtmlTags = (html: string): string => {
        return html.replace(/<[^>]*>/g, '');
    };

    const addWord = () => {
        if (words.length < 20) {
            setWords([...words, { englishWord: '', koreanMeaning: '' }]);
        }
    };

    const removeWord = (index: number) => {
        if (words.length > 1) {
            setWords(words.filter((_, i) => i !== index));
        }
    };

    const updateWord = (index: number, field: keyof WordMeaning, value: string) => {
        const newWords = [...words];
        newWords[index][field] = value;
        setWords(newWords);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 빈 단어 필터링
            const validWords = words.filter(word =>
                word.englishWord.trim() && word.koreanMeaning.trim()
            );

            if (validWords.length === 0) {
                throw new Error('최소 1개 이상의 단어를 입력해야 합니다.');
            }

            // API 호출로 변경
            const response = await fetch('/api/generate-story', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    words: validWords,
                    difficulty: difficulty
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '스토리 생성 중 오류가 발생했습니다.');
            }

            const result = await response.json();
            setStory(result);
            setShowTranslation(false); // 기본값은 가림 상태
        } catch (err) {
            setError(err instanceof Error ? err.message : '스토리 생성 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTTS = () => {
        if (story?.englishStory) {
            // HTML 태그 제거 후 TTS 재생
            const cleanText = stripHtmlTags(story.englishStory);
            ttsUtility.speak(cleanText);
        }
    };

    const copyToClipboard = (text: string) => {
        // HTML 태그 제거 후 클립보드에 복사
        const cleanText = stripHtmlTags(text);
        navigator.clipboard.writeText(cleanText).then(() => {
            alert('클립보드에 복사되었습니다.');
        });
    };

    // Excel 업로드 처리 함수들
    const handleExcelImport = (data: ExcelImportData[]) => {
        // Excel 데이터를 WordMeaning 형식으로 변환
        const convertedWords: WordMeaning[] = data.map(item => ({
            englishWord: item.englishWord,
            koreanMeaning: item.koreanMeaning
        }));

        // 20개 제한
        const limitedWords = convertedWords.slice(0, 20);
        setWords(limitedWords);
    };

    const handleExcelError = (error: string) => {
        setError(error);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        영어 단어 기반 스토리 생성
                    </h1>
                    <p className="text-gray-600">
                        여러 영어 단어를 입력하여 재미있는 영어 이야기를 만들어보세요
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 단어 입력 섹션 */}
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">영어 단어 입력</h2>

                        {/* Excel 업로드 버튼 */}
                        <div className="mb-4">
                            <ExcelImportButton
                                onImport={handleExcelImport}
                                onError={handleExcelError}
                                disabled={isLoading}
                            />
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            여러 영어 단어를 입력하여 스토리를 생성하세요. 최대 20개까지 입력 가능합니다.
                        </p>

                        <div className="space-y-3">
                            {words.map((word, index) => (
                                <div key={index} className="flex gap-3 items-center">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="영어 단어"
                                            value={word.englishWord}
                                            onChange={(e) => updateWord(index, 'englishWord', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="한국어 의미"
                                            value={word.koreanMeaning}
                                            onChange={(e) => updateWord(index, 'koreanMeaning', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => removeWord(index)}
                                        disabled={words.length <= 1}
                                        className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300"
                                    >
                                        삭제
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4">
                            <Button
                                type="button"
                                onClick={addWord}
                                disabled={words.length >= 20}
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300"
                            >
                                단어 추가 ({words.length}/20)
                            </Button>
                        </div>
                    </Card>

                    {/* 난이도 선택 섹션 */}
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">난이도 선택</h2>
                        <div className="grid grid-cols-3 gap-4">
                            {(['easy', 'medium', 'hard'] as StoryDifficulty[]).map((level) => (
                                <label key={level} className="flex items-center">
                                    <input
                                        type="radio"
                                        name="difficulty"
                                        value={level}
                                        checked={difficulty === level}
                                        onChange={(e) => setDifficulty(e.target.value as StoryDifficulty)}
                                        className="mr-2"
                                    />
                                    <span className="capitalize">
                                        {level === 'easy' ? '쉬움' : level === 'medium' ? '보통' : '어려움'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </Card>

                    {/* 제출 버튼 */}
                    <div className="text-center">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {isLoading ? '스토리 생성 중...' : '스토리 생성'}
                        </Button>
                    </div>
                </form>

                {/* 로딩 표시 */}
                {isLoading && (
                    <div className="mt-8 text-center">
                        <LoadingIndicator />
                    </div>
                )}

                {/* 에러 표시 */}
                {error && (
                    <div className="mt-8">
                        <Card className="border-red-200 bg-red-50">
                            <div className="text-red-700">
                                <h3 className="font-semibold">오류 발생</h3>
                                <p>{error}</p>
                            </div>
                        </Card>
                    </div>
                )}

                {/* 스토리 결과 표시 */}
                {story && (
                    <div className="mt-8 space-y-6">
                        <Card>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">생성된 영어 스토리</h2>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleTTS}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                                    >
                                        🔊 음성 듣기
                                    </Button>
                                    <PrintButton
                                        story={story}
                                        variant="secondary"
                                        size="md"
                                        showPreview={false}
                                    />
                                    <ExcelExportButton
                                        story={story}
                                        variant="secondary"
                                        size="md"
                                    />
                                    <Button
                                        onClick={() => copyToClipboard(story.englishStory)}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                                    >
                                        복사
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <div
                                    className="text-lg leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: story.englishStory }}
                                />
                            </div>

                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold">한국어 해석</h3>
                                <Button
                                    onClick={() => setShowTranslation(!showTranslation)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                >
                                    {showTranslation ? '숨기기' : '보기'}
                                </Button>
                            </div>

                            {showTranslation && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="leading-relaxed">{story.koreanTranslation}</p>
                                </div>
                            )}
                        </Card>

                        <Card>
                            <h3 className="text-lg font-semibold mb-3">사용된 단어</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {story.usedWords.map((word, index) => (
                                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                        <div className="font-medium text-blue-600">{word.englishWord}</div>
                                        <div className="text-sm text-gray-600">{word.koreanMeaning}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
