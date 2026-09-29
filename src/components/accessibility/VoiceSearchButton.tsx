import React, { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';

interface VoiceSearchButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onTranscript,
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    // Checar suporte ao Web Speech API
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const handleToggleListening = () => {
    if (!isSupported) {
      alert('A busca por voz não é suportada diretamente pelo seu navegador. Tente digitar no campo de busca.');
      return;
    }

    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognitionClass as any)();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage('Ouvindo... Pode falar agora.');
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setStatusMessage(`Busca reconhecida: "${transcript}"`);
        onTranscript(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setStatusMessage('Não foi possível reconhecer a voz. Tente novamente.');
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error('Erro ao iniciar reconhecimento de voz:', e);
      setIsListening(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleToggleListening}
        aria-pressed={isListening}
        aria-label={isListening ? 'Ouvindo microfone... Fale o termo de busca' : 'Iniciar busca por voz'}
        title="Buscar por comando de voz"
        className={`p-2.5 rounded-xl border transition-all duration-150 flex items-center justify-center ${
          isListening
            ? 'bg-rose-600 text-white border-rose-700 animate-pulse ring-4 ring-rose-300'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 hover:border-slate-400'
        } ${className}`}
      >
        {isListening ? (
          <Mic className="animate-bounce" size={18} aria-hidden="true" />
        ) : (
          <Mic size={18} aria-hidden="true" />
        )}
      </button>

      {/* Região ao vivo para leitores de tela */}
      <span className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </span>
    </div>
  );
};

// Interface auxiliar
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onresult: (event: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onerror: (event: any) => void;
  onstart: () => void;
  onend: () => void;
}
