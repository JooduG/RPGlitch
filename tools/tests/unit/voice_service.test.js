
import { jest } from '@jest/globals';
import { VoiceService } from '../../../src/js/services/voice-service.js';

describe('VoiceService', () => {
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
      continuous: false,
      lang: 'en-US',
      interimResults: true,
      maxAlternatives: 1,
    };
    const MockSpeechRecognition = jest.fn(() => mockRecognition);
    window.SpeechRecognition = MockSpeechRecognition;
    window.webkitSpeechRecognition = MockSpeechRecognition;

    voiceService = new VoiceService();
    await voiceService.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('setCallMode(true) should start listening if not speaking or listening', () => {
    voiceService.isSpeaking = false;
    voiceService.isListening = false;

    voiceService.setCallMode(true);

    expect(voiceService.callMode).toBe(true);
    expect(mockRecognition.start).toHaveBeenCalled();
    expect(voiceService.isListening).toBe(true);
  });

  test('setCallMode(false) should stop listening if currently listening', () => {
    // Setup state as listening and callMode active
    voiceService.callMode = true;
    voiceService.isListening = true;

    voiceService.setCallMode(false);

    expect(voiceService.callMode).toBe(false);
    expect(mockRecognition.stop).toHaveBeenCalled();
    // Note: isListening is set to false in _handleRecognitionEnd usually,
    // but here we check if stop() was called.
  });

  test('setCallMode(false) should NOT stop listening if NOT currently listening', () => {
    voiceService.callMode = true;
    voiceService.isListening = false;

    voiceService.setCallMode(false);

    expect(voiceService.callMode).toBe(false);
    expect(mockRecognition.stop).not.toHaveBeenCalled();
  });
});
