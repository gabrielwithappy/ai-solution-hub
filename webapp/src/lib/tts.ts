// TTS 설정 옵션
export interface TTSOptions {
  lang?: string;          // 언어 설정 (기본값: 'en-US')
  rate?: number;          // 말하기 속도 (0.1-10, 기본값: 1)
  pitch?: number;         // 음성 높낮이 (0-2, 기본값: 1)
  volume?: number;        // 음량 (0-1, 기본값: 1)
}

// TTS 상태 관리
export interface TTSState {
  isPlaying: boolean;     // 재생 중 여부
  isPaused: boolean;      // 일시정지 여부
  isSupported: boolean;   // 브라우저 지원 여부
  error: string | null;   // 오류 메시지
}

// TTS 유틸리티 함수 반환 타입
export interface TTSUtility {
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isSupported: () => boolean;
  getVoices: () => SpeechSynthesisVoice[];
  getState: () => TTSState;
}

// 기본 TTS 옵션
const DEFAULT_OPTIONS: Required<TTSOptions> = {
  lang: 'en-US',
  rate: 1,
  pitch: 1,
  volume: 1,
};

/**
 * TTS 유틸리티 생성 함수
 * @returns TTSUtility 인스턴스
 */
export function createTTSUtility(): TTSUtility {
  let currentUtterance: SpeechSynthesisUtterance | null = null;
  let state: TTSState = {
    isPlaying: false,
    isPaused: false,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    error: null,
  };

  /**
   * 브라우저 TTS 지원 여부 확인
   */
  const isSupported = (): boolean => {
    return typeof window !== 'undefined' && 
           'speechSynthesis' in window && 
           'SpeechSynthesisUtterance' in window &&
           window.speechSynthesis !== undefined;
  };

  /**
   * 현재 상태 반환
   */
  const getState = (): TTSState => ({ ...state });

  /**
   * 상태 업데이트
   */
  const updateState = (updates: Partial<TTSState>): void => {
    state = { ...state, ...updates };
  };

  /**
   * 텍스트를 음성으로 재생
   */
  const speak = async (text: string, options: TTSOptions = {}): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 브라우저 지원 확인
      if (!isSupported()) {
        const error = 'TTS is not supported in this browser';
        updateState({ error });
        reject(new Error(error));
        return;
      }

      // 텍스트 유효성 검사
      if (!text || text.trim() === '') {
        const error = 'Text cannot be empty';
        updateState({ error });
        reject(new Error(error));
        return;
      }

      // 이전 재생 중지
      if (currentUtterance) {
        window.speechSynthesis.cancel();
      }

      // 옵션 병합
      const finalOptions = { ...DEFAULT_OPTIONS, ...options };

      // SpeechSynthesisUtterance 생성
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = finalOptions.lang;
      utterance.rate = finalOptions.rate;
      utterance.pitch = finalOptions.pitch;
      utterance.volume = finalOptions.volume;

      // 이벤트 핸들러 설정
      utterance.onstart = () => {
        updateState({ isPlaying: true, isPaused: false, error: null });
      };

      utterance.onend = () => {
        updateState({ isPlaying: false, isPaused: false });
        currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        const error = `TTS Error: ${event.error}`;
        updateState({ isPlaying: false, isPaused: false, error });
        currentUtterance = null;
        reject(new Error(error));
      };

      utterance.onpause = () => {
        updateState({ isPaused: true });
      };

      utterance.onresume = () => {
        updateState({ isPaused: false });
      };

      // 재생 시작
      currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    });
  };

  /**
   * 음성 재생 일시정지
   */
  const pause = (): void => {
    if (isSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  };

  /**
   * 일시정지된 음성 재생 재개
   */
  const resume = (): void => {
    if (isSupported() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };

  /**
   * 음성 재생 정지
   */
  const stop = (): void => {
    if (isSupported()) {
      window.speechSynthesis.cancel();
      updateState({ isPlaying: false, isPaused: false });
      currentUtterance = null;
    }
  };

  /**
   * 사용 가능한 음성 목록 조회
   */
  const getVoices = (): SpeechSynthesisVoice[] => {
    if (!isSupported()) {
      return [];
    }
    return window.speechSynthesis.getVoices();
  };

  // 상태 초기화
  updateState({ isSupported: isSupported() });

  return {
    speak,
    pause,
    resume,
    stop,
    isSupported,
    getVoices,
    getState,
  };
}

/**
 * 기본 TTS 유틸리티 인스턴스
 */
export const ttsUtility = createTTSUtility();
