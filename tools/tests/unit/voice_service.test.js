
import { jest } from '@jest/globals';
import { VoiceService } from '../../../src/js/services/voice-service.js';

describe('VoiceService', () => {
  const {
    speechSynthesis: originalSpeechSynthesis,
    SpeechSynthesisUtterance: originalSpeechSynthesisUtterance,
    SpeechRecognition: originalSpeechRecognition,
    webkitSpeechRecognition: originalWebkitSpeechRecognition,
  } = window;

  let voiceService;
  let mockSynthesis;
  let mockRecognition;

  beforeEach(async () => {
    // Mock SpeechSynthesis
    mockSynthesis = {
      getVoices: jest.fn().mockReturnValue([]),
      cancel: jest.fn(),
      speak: jest.fn(),
      paused: false,
      resume: jest.fn(),
      onvoiceschanged: null,
    };
    window.speechSynthesis = mockSynthesis;

    // Mock SpeechSynthesisUtterance
    window.SpeechSynthesisUtterance = jest.fn();

    // Mock SpeechRecognition
    mockRecognition = {
      start: jest.fn(),
      stop: jest.fn(),
      onend: null, // Allow service to set this
    };
    const MockSpeechRecognition = jest.fn(() => mockRecognition);
    window.SpeechRecognition = MockSpeechRecognition;
    window.webkitSpeechRecognition = MockSpeechRecognition;

    voiceService = new VoiceService();
    await voiceService.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Restore original window properties for test isolation
    window.speechSynthesis = originalSpeechSynthesis;
    window.SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
    window.SpeechRecognition = originalSpeechRecognition;
    window.webkitSpeechRecognition = originalWebkitSpeechRecognition;
  });

  describe('setCallMode(true)', () => {
    test('should start listening if not speaking or listening', () => {
      voiceService.isSpeaking = false;
      voiceService.isListening = false;

      voiceService.setCallMode(true);

      expect(voiceService.callMode).toBe(true);
      expect(mockRecognition.start).toHaveBeenCalledTimes(1);
      expect(voiceService.isListening).toBe(true);
    });

    test('should not start listening if already speaking', () => {
      voiceService.isSpeaking = true;
      voiceService.isListening = false;

      voiceService.setCallMode(true);

      expect(voiceService.callMode).toBe(true);
      expect(mockRecognition.start).not.toHaveBeenCalled();
    });

    test('should not start listening if already listening', () => {
      voiceService.isListening = true;

      voiceService.setCallMode(true);

      expect(voiceService.callMode).toBe(true);
      expect(mockRecognition.start).not.toHaveBeenCalled();
    });
  });

  describe('setCallMode(false)', () => {
    test('should stop listening and update state on recognition end', () => {
      // Setup state as listening
      voiceService.callMode = true;
      voiceService.isListening = true;

      voiceService.setCallMode(false);

      expect(voiceService.callMode).toBe(false);
      expect(mockRecognition.stop).toHaveBeenCalledTimes(1);

      // Simulate the async 'end' event from the SpeechRecognition API
      expect(mockRecognition.onend).toBeInstanceOf(Function);
      mockRecognition.onend();

      expect(voiceService.isListening).toBe(false);
    });

    test('should not stop listening if not currently listening', () => {
      voiceService.callMode = true;
      voiceService.isListening = false;

      voiceService.setCallMode(false);

      expect(voiceService.callMode).toBe(false);
      expect(mockRecognition.stop).not.toHaveBeenCalled();
    });
  });
});
