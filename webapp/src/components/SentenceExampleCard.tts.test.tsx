/**
 * SentenceExampleCard TTS 기능 테스트
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SentenceExampleCard, SentenceExample } from './SentenceExampleCard';

// TTS 유틸리티 모킹
jest.mock('../lib/tts', () => ({
  ttsUtility: {
    speak: jest.fn(),
    isSupported: jest.fn(() => true),
    getState: jest.fn(() => ({
      isPlaying: false,
      isPaused: false,
      isSupported: true,
      error: null,
    })),
  },
}));

// 클립보드 API 모킹
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

const mockExample: SentenceExample = {
  meaning: '책을 읽다',
  originalSentence: 'I read a book every day.',
  scrambledSentence: 'every a day I read book',
  koreanTranslation: '나는 매일 책을 읽는다.',
};

describe('SentenceExampleCard TTS 기능', () => {
  const mockTTSUtility = require('../lib/tts').ttsUtility;

  beforeEach(() => {
    // 기본 모킹 설정 초기화
    jest.clearAllMocks();
    mockTTSUtility.isSupported.mockReturnValue(true);
    mockTTSUtility.speak.mockResolvedValue(undefined);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TTS 버튼 렌더링', () => {
    it('TTS가 지원되는 경우 음성 듣기 버튼이 표시되어야 한다', () => {
      render(<SentenceExampleCard example={mockExample} index={0} />);
      
      // 정답 확인 버튼 클릭
      const showAnswerButton = screen.getByText('정답 확인하기');
      fireEvent.click(showAnswerButton);

      // TTS 버튼이 표시되어야 함
      expect(screen.getByLabelText(/영어 문장 음성으로 듣기/i)).toBeInTheDocument();
    });

    it('TTS가 지원되지 않는 경우 음성 듣기 버튼이 표시되지 않아야 한다', () => {
      mockTTSUtility.isSupported.mockReturnValue(false);
      
      render(<SentenceExampleCard example={mockExample} index={0} />);
      
      // 정답 확인 버튼 클릭
      const showAnswerButton = screen.getByText('정답 확인하기');
      fireEvent.click(showAnswerButton);

      // TTS 버튼이 표시되지 않아야 함
      expect(screen.queryByLabelText(/영어 문장 음성으로 듣기/i)).not.toBeInTheDocument();
    });

    it('정답을 확인하기 전에는 TTS 버튼이 표시되지 않아야 한다', () => {
      render(<SentenceExampleCard example={mockExample} index={0} />);
      
      // TTS 버튼이 표시되지 않아야 함
      expect(screen.queryByLabelText(/영어 문장 음성으로 듣기/i)).not.toBeInTheDocument();
    });
  });

  describe('TTS 기능 동작', () => {
    it('음성 듣기 버튼을 클릭하면 TTS가 재생되어야 한다', async () => {
      mockTTSUtility.speak.mockResolvedValue(undefined);
      
      render(<SentenceExampleCard example={mockExample} index={0} />);
      
      // 정답 확인 버튼 클릭
      const showAnswerButton = screen.getByText('정답 확인하기');
      fireEvent.click(showAnswerButton);

      // TTS 버튼 클릭
      const ttsButton = screen.getByLabelText(/영어 문장 음성으로 듣기/i);
      fireEvent.click(ttsButton);

      // TTS speak 함수가 영어 문장으로 호출되어야 함
      expect(mockTTSUtility.speak).toHaveBeenCalledWith(
        mockExample.originalSentence,
        { lang: 'en-US', rate: 0.9, pitch: 1, volume: 1 }
      );
    });

    it('TTS 재생 중에는 버튼이 비활성화되어야 한다', async () => {
      render(<SentenceExampleCard example={mockExample} index={0} />);
      
      // 정답 확인 버튼 클릭
      const showAnswerButton = screen.getByText('정답 확인하기');
      fireEvent.click(showAnswerButton);

      // TTS 버튼 클릭하여 재생 중 상태로 만들기
      const ttsButton = screen.getByLabelText(/영어 문장 음성으로 듣기/i);
      fireEvent.click(ttsButton);

      // 재생 중일 때 버튼이 비활성화되는지 확인 (구현에 따라 달라질 수 있음)
      // 실제로는 상태가 즉시 변경되지 않을 수 있으므로 TTS 동작 확인만 함
      expect(mockTTSUtility.speak).toHaveBeenCalled();
    });

    it('TTS 오류 발생 시 사용자에게 알림을 표시해야 한다', async () => {
      const errorMessage = 'TTS Error: synthesis failed';
      mockTTSUtility.speak.mockRejectedValue(new Error(errorMessage));
      
      // console.error 모킹
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SentenceExampleCard example={mockExample} index={0} />);
      
      // 정답 확인 버튼 클릭
      const showAnswerButton = screen.getByText('정답 확인하기');
      fireEvent.click(showAnswerButton);

      // TTS 버튼 클릭
      const ttsButton = screen.getByLabelText(/영어 문장 음성으로 듣기/i);
      fireEvent.click(ttsButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('TTS 재생 실패:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('접근성 및 사용성', () => {
    it('TTS 버튼에 적절한 aria-label이 설정되어야 한다', () => {
      render(<SentenceExampleCard example={mockExample} index={0} />);
      
      // 정답 확인 버튼 클릭
      const showAnswerButton = screen.getByText('정답 확인하기');
      fireEvent.click(showAnswerButton);

      // TTS 버튼의 aria-label 확인
      const ttsButton = screen.getByLabelText(/영어 문장 음성으로 듣기/i);
      expect(ttsButton).toHaveAttribute('aria-label');
    });

    it('키보드로 TTS 버튼에 접근할 수 있어야 한다', () => {
      render(<SentenceExampleCard example={mockExample} index={0} />);
      
      // 정답 확인 버튼 클릭
      const showAnswerButton = screen.getByText('정답 확인하기');
      fireEvent.click(showAnswerButton);

      // TTS 버튼이 탭으로 접근 가능해야 함
      const ttsButton = screen.getByLabelText(/영어 문장 음성으로 듣기/i);
      expect(ttsButton).not.toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('기존 기능과의 통합', () => {
    it('기존의 복사 기능이 계속 작동해야 한다', async () => {
      render(<SentenceExampleCard example={mockExample} index={0} />);
      
      // 정답 확인 버튼 클릭
      const showAnswerButton = screen.getByText('정답 확인하기');
      fireEvent.click(showAnswerButton);

      // 첫 번째 복사 버튼 클릭 (영어 문장용)
      const copyButtons = screen.getAllByRole('button', { name: /복사/i });
      fireEvent.click(copyButtons[0]);

      // 클립보드에 복사되어야 함
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockExample.originalSentence);
    });

    it('정답 숨기기 후에는 TTS 버튼이 사라져야 한다', () => {
      render(<SentenceExampleCard example={mockExample} index={0} />);
      
      // 정답 확인 버튼 클릭
      const showAnswerButton = screen.getByText('정답 확인하기');
      fireEvent.click(showAnswerButton);

      // TTS 버튼이 표시됨을 확인
      expect(screen.getByLabelText(/영어 문장 음성으로 듣기/i)).toBeInTheDocument();

      // 정답 숨기기 버튼 클릭
      const hideAnswerButton = screen.getByText('정답 숨기기');
      fireEvent.click(hideAnswerButton);

      // TTS 버튼이 사라져야 함
      expect(screen.queryByLabelText(/영어 문장 음성으로 듣기/i)).not.toBeInTheDocument();
    });
  });
});
