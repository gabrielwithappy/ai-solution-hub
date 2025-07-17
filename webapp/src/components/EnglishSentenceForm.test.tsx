/**
 * 영어 문장 입력 폼 컴포넌트 테스트
 * TDD: 테스트 먼저 작성
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnglishSentenceForm } from './EnglishSentenceForm';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('EnglishSentenceForm 컴포넌트', () => {
  const mockOnResult = jest.fn();
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('폼 요소들이 올바르게 렌더링된다', () => {
    // When: 컴포넌트 렌더링
    render(<EnglishSentenceForm onResult={mockOnResult} />);

    // Then: 필요한 요소들이 표시된다
    expect(screen.getByLabelText(/영어 단어 입력/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/난이도 선택/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /문장 생성/i })).toBeInTheDocument();
    
    // 레벨 옵션들 확인
    expect(screen.getByDisplayValue('초급')).toBeInTheDocument();
    expect(screen.getByText('중급')).toBeInTheDocument();
    expect(screen.getByText('고급')).toBeInTheDocument();
  });

  test('단어 입력과 레벨 선택이 작동한다', async () => {
    const user = userEvent.setup();
    
    // When: 컴포넌트 렌더링
    render(<EnglishSentenceForm onResult={mockOnResult} />);
    
    const wordInput = screen.getByLabelText(/영어 단어 입력/i);
    const levelSelect = screen.getByLabelText(/난이도 선택/i);

    // When: 단어 입력
    await user.type(wordInput, 'cat');
    expect(wordInput).toHaveValue('cat');

    // When: 레벨 변경
    await user.selectOptions(levelSelect, '중급');
    expect(levelSelect).toHaveValue('중급');
  });

  test('유효한 입력으로 폼 제출 시 API 호출', async () => {
    const user = userEvent.setup();
    
    // Given: 성공적인 API 응답 모킹
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        examples: [
          {
            meaning: '고양이',
            originalSentence: 'I have a cat.',
            scrambledSentence: 'have I a cat.',
            koreanTranslation: '나는 고양이를 기르고 있습니다.'
          }
        ],
        provider: 'openai'
      })
    } as Response);

    // When: 컴포넌트 렌더링
    render(<EnglishSentenceForm onResult={mockOnResult} />);
    
    const wordInput = screen.getByLabelText(/영어 단어 입력/i);
    const levelSelect = screen.getByLabelText(/난이도 선택/i);
    const submitButton = screen.getByRole('button', { name: /문장 생성/i });

    // When: 폼 작성 및 제출
    await user.type(wordInput, 'cat');
    await user.selectOptions(levelSelect, '중급');
    await user.click(submitButton);

    // Then: API 호출 확인
    expect(mockFetch).toHaveBeenCalledWith('/api/generate-sentence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: 'cat',
        level: '중급'
      })
    });

    // Then: 결과 콜백 호출 확인
    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith({
        examples: [
          {
            meaning: '고양이',
            originalSentence: 'I have a cat.',
            scrambledSentence: 'have I a cat.',
            koreanTranslation: '나는 고양이를 기르고 있습니다.'
          }
        ],
        provider: 'openai'
      });
    });
  });

  test('빈 단어로 제출 시 에러 메시지 표시', async () => {
    const user = userEvent.setup();
    
    // When: 컴포넌트 렌더링
    render(<EnglishSentenceForm onResult={mockOnResult} />);
    
    const submitButton = screen.getByRole('button', { name: /문장 생성/i });

    // When: 빈 단어로 제출
    await user.click(submitButton);

    // Then: 에러 메시지 표시
    await waitFor(() => {
      expect(screen.getByText(/영어 단어를 입력해주세요/i)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('50자 초과 단어 입력 시 에러 메시지 표시', async () => {
    const user = userEvent.setup();
    
    // When: 컴포넌트 렌더링
    render(<EnglishSentenceForm onResult={mockOnResult} />);
    
    const wordInput = screen.getByLabelText(/영어 단어 입력/i);
    const longWord = 'a'.repeat(51);

    // When: 긴 단어 입력 (paste로 한번에)
    await user.click(wordInput);
    await user.paste(longWord);

    // Then: 글자 수 제한 표시
    expect(screen.getByText(/50자를 초과할 수 없습니다/i)).toBeInTheDocument();
  });

  test('API 호출 중 로딩 상태 표시', async () => {
    const user = userEvent.setup();
    
    // Given: 지연된 API 응답
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ 
          examples: [{ 
            meaning: 'test', 
            originalSentence: 'Test sentence', 
            scrambledSentence: 'sentence Test',
            koreanTranslation: '테스트 문장'
          }], 
          provider: 'openai' 
        })
      } as Response), 100))
    );

    // When: 컴포넌트 렌더링
    render(<EnglishSentenceForm onResult={mockOnResult} />);
    
    const wordInput = screen.getByLabelText(/영어 단어 입력/i);
    const submitButton = screen.getByRole('button', { name: /문장 생성/i });

    // When: 폼 제출
    await user.type(wordInput, 'cat');
    await user.click(submitButton);

    // Then: 로딩 상태 확인
    expect(screen.getByText(/생성 중.../i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.queryByText(/생성 중.../i)).not.toBeInTheDocument();
    });
  });

  test('API 호출 실패 시 에러 메시지 표시', async () => {
    const user = userEvent.setup();
    
    // Given: 실패하는 API 응답
    mockFetch.mockRejectedValueOnce(new Error('네트워크 오류'));

    // When: 컴포넌트 렌더링
    render(<EnglishSentenceForm onResult={mockOnResult} />);
    
    const wordInput = screen.getByLabelText(/영어 단어 입력/i);
    const submitButton = screen.getByRole('button', { name: /문장 생성/i });

    // When: 폼 제출
    await user.type(wordInput, 'cat');
    await user.click(submitButton);

    // Then: 에러 메시지 확인
    await waitFor(() => {
      expect(screen.getByText(/오류가 발생했습니다/i)).toBeInTheDocument();
    });
  });

  test('글자 수 카운터가 실시간으로 업데이트된다', async () => {
    const user = userEvent.setup();
    
    // When: 컴포넌트 렌더링
    render(<EnglishSentenceForm onResult={mockOnResult} />);
    
    const wordInput = screen.getByLabelText(/영어 단어 입력/i);

    // When: 단어 입력
    await user.type(wordInput, 'hello');

    // Then: 글자 수 표시
    expect(screen.getByText('5 / 50')).toBeInTheDocument();
  });
});
