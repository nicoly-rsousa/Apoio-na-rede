import { browserStorage, readStoredArray } from '../lib/browserStorage';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AccessibilitySettings, DisabilityType } from '../types';

const SETTINGS_KEY = 'acessacidade_accessibility_settings';
const PREFERENCES_KEY = 'apoio_accessibility_preferences_v1';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  accessibilityPreferences: DisabilityType[];
  applySettings: (settings: Partial<AccessibilitySettings>) => void;
  setAccessibilityPreferences: (preferences: DisabilityType[]) => void;
  setFontSize: (size: 'sm' | 'md' | 'lg' | 'xl') => void;
  setHighContrast: (mode: 'default' | 'dark' | 'yellow-black') => void;
  toggleDyslexicFont: () => void;
  toggleReducedSensory: () => void;
  toggleVoiceReading: () => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  activeSpeechText: string;
  speechError: string;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'md',
  highContrast: 'default',
  dyslexicFont: false,
  reducedSensory: false,
  voiceReadingEnabled: true,
  preferredView: 'map',
  enhancedFocus: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = browserStorage.getItem(SETTINGS_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [accessibilityPreferences, setAccessibilityPreferencesState] = useState<DisabilityType[]>(() => {
    try {
      return readStoredArray<DisabilityType>(PREFERENCES_KEY).filter(type => ['mobilidade', 'visual', 'auditiva', 'intelectual', 'invisivel'].includes(type));
    } catch {
      return [];
    }
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeechText, setActiveSpeechText] = useState('');
  const [speechError, setSpeechError] = useState('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Persistir e aplicar classes globais no DOM
  useEffect(() => {
    browserStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    // Escala de Fonte
    document.documentElement.classList.remove('font-size-sm', 'font-size-md', 'font-size-lg', 'font-size-xl');
    document.documentElement.classList.add(`font-size-${settings.fontSize}`);

    // Alto Contraste
    document.body.classList.remove('theme-high-contrast-dark', 'theme-yellow-black');
    if (settings.highContrast === 'dark') {
      document.body.classList.add('theme-high-contrast-dark');
    } else if (settings.highContrast === 'yellow-black') {
      document.body.classList.add('theme-yellow-black');
    }

    // Fonte para Dislexia
    if (settings.dyslexicFont) {
      document.body.classList.add('font-dyslexic');
    } else {
      document.body.classList.remove('font-dyslexic');
    }

    // Redução Sensorial (Autismo / TDAH)
    if (settings.reducedSensory) {
      document.body.classList.add('reduced-sensory');
    } else {
      document.body.classList.remove('reduced-sensory');
    }

    document.body.classList.toggle('enhanced-focus', settings.enhancedFocus);
  }, [settings]);

  const setAccessibilityPreferences = (preferences: DisabilityType[]) => {
    setAccessibilityPreferencesState(preferences);
    browserStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  };

  const setFontSize = (size: 'sm' | 'md' | 'lg' | 'xl') => {
    setSettings((prev) => ({ ...prev, fontSize: size }));
  };

  const applySettings = (nextSettings: Partial<AccessibilitySettings>) => {
    setSettings((previous) => ({ ...previous, ...nextSettings }));
  };

  const setHighContrast = (mode: 'default' | 'dark' | 'yellow-black') => {
    setSettings((prev) => ({ ...prev, highContrast: mode }));
  };

  const toggleDyslexicFont = () => {
    setSettings((prev) => ({ ...prev, dyslexicFont: !prev.dyslexicFont }));
  };

  const toggleReducedSensory = () => {
    setSettings((prev) => ({ ...prev, reducedSensory: !prev.reducedSensory }));
  };

  const toggleVoiceReading = () => {
    setSettings((prev) => ({ ...prev, voiceReadingEnabled: !prev.voiceReadingEnabled }));
  };

  // Síntese de Voz (TTS)
  const speakText = (text: string) => {
    if (!settings.voiceReadingEnabled) return;
    setSpeechError('');
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setSpeechError('Este navegador não oferece leitura em voz alta. Tente outro navegador.');
      return;
    }

    stopSpeaking();
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) {
      setSpeechError('Não há texto disponível para leitura nesta página.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(item => item.lang.toLowerCase().replace('_', '-') === 'pt-br')
      ?? voices.find(item => item.lang.toLowerCase().startsWith('pt'));
    if (voice) utterance.voice = voice;
    utteranceRef.current = utterance;
    setIsSpeaking(true);
    setActiveSpeechText(cleanText);

    utterance.onstart = () => {
      if (utteranceRef.current !== utterance) return;
      setIsSpeaking(true);
      setActiveSpeechText(cleanText);
    };

    utterance.onend = () => {
      if (utteranceRef.current !== utterance) return;
      utteranceRef.current = null;
      setIsSpeaking(false);
      setActiveSpeechText('');
    };

    utterance.onerror = (event) => {
      if (utteranceRef.current !== utterance) return;
      utteranceRef.current = null;
      setIsSpeaking(false);
      setActiveSpeechText('');
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        setSpeechError('Não foi possível reproduzir a leitura. Verifique a voz em português nas configurações do dispositivo e tente novamente.');
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    } catch {
      stopSpeaking();
      setSpeechError('Não foi possível iniciar a leitura neste navegador. Tente novamente.');
    }
  };

  const stopSpeaking = () => {
    utteranceRef.current = null;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveSpeechText('');
    }
  };

  useEffect(() => {
    if (!settings.voiceReadingEnabled) stopSpeaking();
    return () => {
      utteranceRef.current = null;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [settings.voiceReadingEnabled]);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        accessibilityPreferences,
        applySettings,
        setAccessibilityPreferences,
        setFontSize,
        setHighContrast,
        toggleDyslexicFont,
        toggleReducedSensory,
        toggleVoiceReading,
        speakText,
        stopSpeaking,
        isSpeaking,
        activeSpeechText,
        speechError,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
