import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceLanguage = 'en-IN' | 'hi-IN' | 'mr-IN' | 'ta-IN' | 'te-IN' | 'kn-IN' | 'gu-IN';

export const VOICE_LANGUAGES: { code: VoiceLanguage; label: string }[] = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'gu-IN', label: 'Gujarati' },
];

const LANG_STORAGE_KEY = 'voice_input_language';

export function getSavedLanguage(): VoiceLanguage {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY) as VoiceLanguage;
    if (saved && VOICE_LANGUAGES.some(l => l.code === saved)) return saved;
  } catch {}
  return 'en-IN';
}

function saveLanguage(lang: VoiceLanguage) {
  try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch {}
}

interface UseVoiceInputOptions {
  onTranscriptFinalized?: (transcript: string) => void;
}

export function useVoiceInput({ onTranscriptFinalized }: UseVoiceInputOptions = {}) {
  const [isSupported] = useState(() => 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguageState] = useState<VoiceLanguage>(getSavedLanguage);
  const recognitionRef = useRef<any>(null);

  const changeLanguage = useCallback((lang: VoiceLanguage) => {
    setLanguageState(lang);
    saveLanguage(lang);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    setError(null);
    setTranscript('');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += text;
        else interim += text;
      }
      setTranscript(final || interim);
    };

    recognition.onerror = (event: any) => {
      const messages: Record<string, string> = {
        'not-allowed': 'Microphone access denied. Please allow microphone access and try again.',
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'Microphone not found. Please check your microphone.',
        'network': 'Network error. Please check your connection.',
      };
      setError(messages[event.error] || `Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (onTranscriptFinalized) {
        const finalText = (recognitionRef.current as any)?._lastTranscript;
        if (finalText) onTranscriptFinalized(finalText);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, language, onTranscriptFinalized]);

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    language,
    changeLanguage,
    startListening,
    stopListening,
    clearTranscript: () => setTranscript(''),
    clearError: () => setError(null),
  };
}
