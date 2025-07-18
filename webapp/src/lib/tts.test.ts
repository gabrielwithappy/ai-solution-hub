import { TTSUtility, createTTSUtility, TTSOptions } from './tts';

// Web Speech API 모킹
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(),
  speaking: false,
  paused: false,
  pending: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSpeechSynthesisUtterance = jest.fn().mockImplementation(function(this: any, text: string) {
  this.text = text;
  this.lang = 'en-US';
  this.rate = 1;
  this.pitch = 1;
  this.volume = 1;
  this.onstart = null;
  this.onend = null;
  this.onerror = null;
  this.onpause = null;
  this.onresume = null;
  this.onmark = null;
  this.onboundary = null;
  return this;
});

describe('TTS Utility', () => {
  let ttsUtility: TTSUtility;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalSpeechSynthesis: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalSpeechSynthesisUtterance: any;

  beforeAll(() => {
    // 원본 저장
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalSpeechSynthesis = (global as any).speechSynthesis;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalSpeechSynthesisUtterance = (global as any).SpeechSynthesisUtterance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 전역 객체 모킹
    Object.defineProperty(global, 'speechSynthesis', {
      writable: true,
      value: mockSpeechSynthesis,
    });

    Object.defineProperty(global, 'SpeechSynthesisUtterance', {
      writable: true,
      value: mockSpeechSynthesisUtterance,
    });

    // window 객체도 설정
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: mockSpeechSynthesis,
    });

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      writable: true,
      value: mockSpeechSynthesisUtterance,
    });

    ttsUtility = createTTSUtility();
  });

  afterAll(() => {
    // 원본 복원
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).speechSynthesis = originalSpeechSynthesis;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
  });

  describe('브라우저 호환성 확인', () => {
    it('Web Speech API가 지원되는 경우 true를 반환해야 한다', () => {
      expect(ttsUtility.isSupported()).toBe(true);
    });

    it('Web Speech API가 지원되지 않는 경우 false를 반환해야 한다', () => {
      // speechSynthesis를 undefined로 설정
      Object.defineProperty(window, 'speechSynthesis', {
        writable: true,
        value: undefined,
      });

      const unsupportedTTS = createTTSUtility();
      expect(unsupportedTTS.isSupported()).toBe(false);
    });
  });

  describe('음성 재생 기능', () => {
    it('영어 문장을 음성으로 재생해야 한다', async () => {
      const text = 'Hello, this is a test sentence.';
      
      // onend 이벤트를 즉시 트리거하도록 설정
      mockSpeechSynthesis.speak.mockImplementation((utterance) => {
        setTimeout(() => {
          if (utterance.onend) utterance.onend({} as SpeechSynthesisEvent);
        }, 0);
      });
      
      await ttsUtility.speak(text);

      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith(text);
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('TTS 옵션을 적용하여 음성을 재생해야 한다', async () => {
      const text = 'Test sentence';
      const options: TTSOptions = {
        lang: 'en-US',
        rate: 0.8,
        pitch: 1.2,
        volume: 0.9,
      };

      // onend 이벤트를 즉시 트리거하도록 설정
      mockSpeechSynthesis.speak.mockImplementation((utterance) => {
        setTimeout(() => {
          if (utterance.onend) utterance.onend({} as SpeechSynthesisEvent);
        }, 0);
      });

      await ttsUtility.speak(text, options);

      const utteranceCall = mockSpeechSynthesisUtterance.mock.calls[0];
      const utteranceInstance = mockSpeechSynthesisUtterance.mock.instances[0];
      
      expect(utteranceCall[0]).toBe(text);
      expect(utteranceInstance.lang).toBe(options.lang);
      expect(utteranceInstance.rate).toBe(options.rate);
      expect(utteranceInstance.pitch).toBe(options.pitch);
      expect(utteranceInstance.volume).toBe(options.volume);
    });

    it('기본 옵션으로 음성을 재생해야 한다', async () => {
      const text = 'Default options test';

      // onend 이벤트를 즉시 트리거하도록 설정
      mockSpeechSynthesis.speak.mockImplementation((utterance) => {
        setTimeout(() => {
          if (utterance.onend) utterance.onend({} as SpeechSynthesisEvent);
        }, 0);
      });

      await ttsUtility.speak(text);

      const utteranceInstance = mockSpeechSynthesisUtterance.mock.instances[0];
      expect(utteranceInstance.lang).toBe('en-US');
      expect(utteranceInstance.rate).toBe(1);
      expect(utteranceInstance.pitch).toBe(1);
      expect(utteranceInstance.volume).toBe(1);
    });
  });

  describe('음성 제어 기능', () => {
    it('음성 재생을 일시정지할 수 있어야 한다', () => {
      mockSpeechSynthesis.speaking = true;
      ttsUtility.pause();
      expect(mockSpeechSynthesis.pause).toHaveBeenCalled();
    });

    it('일시정지된 음성을 재개할 수 있어야 한다', () => {
      mockSpeechSynthesis.paused = true;
      ttsUtility.resume();
      expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
    });

    it('음성 재생을 정지할 수 있어야 한다', () => {
      ttsUtility.stop();
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });
  });

  describe('음성 목록 조회', () => {
    it('사용 가능한 음성 목록을 반환해야 한다', () => {
      const mockVoices = [
        { name: 'Voice 1', lang: 'en-US' } as SpeechSynthesisVoice,
        { name: 'Voice 2', lang: 'en-GB' } as SpeechSynthesisVoice,
      ];
      mockSpeechSynthesis.getVoices.mockReturnValue(mockVoices);

      const voices = ttsUtility.getVoices();
      expect(voices).toEqual(mockVoices);
      expect(mockSpeechSynthesis.getVoices).toHaveBeenCalled();
    });
  });

  describe('오류 처리', () => {
    it('브라우저가 TTS를 지원하지 않으면 오류를 발생시켜야 한다', async () => {
      // speechSynthesis를 undefined로 설정
      Object.defineProperty(window, 'speechSynthesis', {
        writable: true,
        value: undefined,
      });

      const unsupportedTTS = createTTSUtility();
      
      await expect(unsupportedTTS.speak('test')).rejects.toThrow(
        'TTS is not supported in this browser'
      );
    });

    it('빈 텍스트로 음성 재생을 시도하면 오류를 발생시켜야 한다', async () => {
      await expect(ttsUtility.speak('')).rejects.toThrow(
        'Text cannot be empty'
      );
    });
  });

  describe('상태 관리', () => {
    it('초기 상태가 올바르게 설정되어야 한다', () => {
      const state = ttsUtility.getState();
      expect(state).toEqual({
        isPlaying: false,
        isPaused: false,
        isSupported: true,
        error: null,
      });
    });
  });
});
