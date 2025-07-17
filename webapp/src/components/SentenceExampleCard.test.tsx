/**
 * SentenceExampleCard 컴포넌트 테스트
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SentenceExampleCard } from './SentenceExampleCard';

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('SentenceExampleCard 컴포넌트', () => {
  const mockExample = {
    meaning: '고양이',
    originalSentence: 'I have a cat.',
    scrambledSentence: 'have I a cat.',
    koreanTranslation: '나는 고양이를 기르고 있습니다.'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('초기 상태: scrambled 문장과 정답 확인 버튼이 표시된다', () => {
    // When: 컴포넌트 렌더링
    render(<SentenceExampleCard example={mockExample} index={0} />);

    // Then: 기본 요소들이 표시된다
    expect(screen.getByText('의미 1: 고양이')).toBeInTheDocument();
    expect(screen.getByText('have I a cat.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /정답 확인하기/i })).toBeInTheDocument();
    
    // 정답은 아직 숨겨져 있어야 함
    expect(screen.queryByText('I have a cat.')).not.toBeInTheDocument();
    expect(screen.queryByText('나는 고양이를 기르고 있습니다.')).not.toBeInTheDocument();
  });

  test('정답 확인 버튼 클릭 시 원문과 해석이 표시된다', async () => {
    const user = userEvent.setup();
    
    // When: 컴포넌트 렌더링
    render(<SentenceExampleCard example={mockExample} index={0} />);
    
    const showAnswerButton = screen.getByRole('button', { name: /정답 확인하기/i });

    // When: 정답 확인 버튼 클릭
    await user.click(showAnswerButton);

    // Then: 정답이 표시된다
    expect(screen.getByText('I have a cat.')).toBeInTheDocument();
    expect(screen.getByText('나는 고양이를 기르고 있습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /정답 숨기기/i })).toBeInTheDocument();
    
    // 정답 확인 버튼은 사라져야 함
    expect(screen.queryByRole('button', { name: /정답 확인하기/i })).not.toBeInTheDocument();
  });

  test('정답 숨기기 버튼 클릭 시 정답이 다시 숨겨진다', async () => {
    const user = userEvent.setup();
    
    // When: 컴포넌트 렌더링
    render(<SentenceExampleCard example={mockExample} index={0} />);
    
    // When: 정답 확인 후 숨기기
    await user.click(screen.getByRole('button', { name: /정답 확인하기/i }));
    await user.click(screen.getByRole('button', { name: /정답 숨기기/i }));

    // Then: 정답이 다시 숨겨진다
    expect(screen.queryByText('I have a cat.')).not.toBeInTheDocument();
    expect(screen.queryByText('나는 고양이를 기르고 있습니다.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /정답 확인하기/i })).toBeInTheDocument();
  });

  test('영어 문장 복사 기능이 작동한다', async () => {
    const user = userEvent.setup();
    const mockWriteText = jest.spyOn(navigator.clipboard, 'writeText');
    
    // When: 컴포넌트 렌더링 및 정답 확인
    render(<SentenceExampleCard example={mockExample} index={0} />);
    await user.click(screen.getByRole('button', { name: /정답 확인하기/i }));
    
    // When: 영어 문장 복사 버튼 클릭
    const copyButtons = screen.getAllByText('복사');
    await user.click(copyButtons[0]); // 첫 번째 복사 버튼 (영어 문장)

    // Then: 클립보드에 복사된다
    expect(mockWriteText).toHaveBeenCalledWith('I have a cat.');
  });

  test('한국어 해석 복사 기능이 작동한다', async () => {
    const user = userEvent.setup();
    const mockWriteText = jest.spyOn(navigator.clipboard, 'writeText');
    
    // When: 컴포넌트 렌더링 및 정답 확인
    render(<SentenceExampleCard example={mockExample} index={0} />);
    await user.click(screen.getByRole('button', { name: /정답 확인하기/i }));
    
    // When: 한국어 해석 복사 버튼 클릭
    const copyButtons = screen.getAllByText('복사');
    await user.click(copyButtons[1]); // 두 번째 복사 버튼 (한국어 해석)

    // Then: 클립보드에 복사된다
    expect(mockWriteText).toHaveBeenCalledWith('나는 고양이를 기르고 있습니다.');
  });

  test('복사 실패 시 에러가 로깅된다', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(navigator.clipboard, 'writeText')
      .mockRejectedValue(new Error('클립보드 오류'));
    
    // When: 컴포넌트 렌더링 및 정답 확인
    render(<SentenceExampleCard example={mockExample} index={0} />);
    await user.click(screen.getByRole('button', { name: /정답 확인하기/i }));
    
    // When: 복사 버튼 클릭 (실패)
    const copyButtons = screen.getAllByText('복사');
    await user.click(copyButtons[0]);

    // Then: 에러가 로깅된다
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('복사 실패:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  test('인덱스에 따라 의미 번호가 올바르게 표시된다', () => {
    // When: 다른 인덱스로 렌더링
    render(<SentenceExampleCard example={mockExample} index={2} />);

    // Then: 올바른 번호가 표시된다
    expect(screen.getByText('의미 3: 고양이')).toBeInTheDocument();
  });
});
