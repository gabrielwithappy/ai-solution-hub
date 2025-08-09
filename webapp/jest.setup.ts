/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom'

// Fetch polyfill for Jest environment
global.fetch = jest.fn()

// TTS Speech API mocking (Node.js 환경에서 window 객체가 있을 때만)
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'speechSynthesis', {
        value: {
            speak: jest.fn(),
            cancel: jest.fn(),
            pause: jest.fn(),
            resume: jest.fn(),
            getVoices: jest.fn(() => []),
            pending: false,
            speaking: false,
            paused: false
        },
        writable: true
    });

    // SpeechSynthesisUtterance mocking
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
        value: jest.fn().mockImplementation(() => ({
            text: '',
            lang: 'en-US',
            rate: 1,
            pitch: 1,
            volume: 1,
            onstart: null,
            onend: null,
            onerror: null,
            onpause: null,
            onresume: null,
            onmark: null,
            onboundary: null
        })),
        writable: true
    });
}