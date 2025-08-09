/**
 * @jest-environment node
 */
import { POST } from './route';
import { NextRequest } from 'next/server';

// 테스트용 Request 객체 생성 함수
function createRequest(data: any) {
    return new NextRequest('http://localhost:3000/api/generate-story', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
}

describe('/api/generate-story', () => {
    test('유효한 요청에 대해 성공적으로 스토리를 생성해야 한다', async () => {
        const requestData = {
            words: [
                { englishWord: 'cat', koreanMeaning: '고양이' },
                { englishWord: 'house', koreanMeaning: '집' }
            ],
            difficulty: 'easy'
        };

        const request = createRequest(requestData);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.englishStory).toBeDefined();
        expect(data.koreanTranslation).toBeDefined();
        expect(data.usedWords).toHaveLength(2);
        expect(data.difficulty).toBe('easy');
    });

    test('단어 배열이 없으면 400 에러를 반환해야 한다', async () => {
        const requestData = {
            difficulty: 'easy'
        };

        const request = createRequest(requestData);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('단어 배열이 필요합니다.');
    });

    test('난이도가 없으면 400 에러를 반환해야 한다', async () => {
        const requestData = {
            words: [{ englishWord: 'test', koreanMeaning: '테스트' }]
        };

        const request = createRequest(requestData);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('난이도가 필요합니다.');
    });

    test('빈 단어가 포함되어도 유효한 단어로만 스토리를 생성해야 한다', async () => {
        const requestData = {
            words: [
                { englishWord: 'cat', koreanMeaning: '고양이' },
                { englishWord: '', koreanMeaning: '' },
                { englishWord: 'dog', koreanMeaning: '개' }
            ],
            difficulty: 'medium'
        };

        const request = createRequest(requestData);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.usedWords).toHaveLength(2);
    });

    test('모든 단어가 비어있으면 400 에러를 반환해야 한다', async () => {
        const requestData = {
            words: [
                { englishWord: '', koreanMeaning: '' },
                { englishWord: '   ', koreanMeaning: '   ' }
            ],
            difficulty: 'easy'
        };

        const request = createRequest(requestData);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('최소 1개 이상의 유효한 단어를 입력해야 합니다.');
    });

    test('유효하지 않은 난이도가 입력되면 400 에러를 반환해야 한다', async () => {
        const requestData = {
            words: [{ englishWord: 'test', koreanMeaning: '테스트' }],
            difficulty: 'invalid'
        };

        const request = createRequest(requestData);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('유효하지 않은 난이도입니다.');
    });

    test('잘못된 JSON 형식의 요청에 대해 적절히 처리해야 한다', async () => {
        const request = new NextRequest('http://localhost:3000/api/generate-story', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: 'invalid json',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('스토리 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
    });
});
