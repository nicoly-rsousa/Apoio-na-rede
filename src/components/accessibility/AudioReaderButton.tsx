import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

interface AudioReaderButtonProps {
  textToRead: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const AudioReaderButton: React.FC<AudioReaderButtonProps> = ({
  textToRead,
  label = 'Ouvir em voz alta',
  className = '',
  size = 'md',
}) => {
  const { settings, speakText, stopSpeaking, isSpeaking, activeSpeechText } = useAccessibility();
  if (!settings.voiceReadingEnabled) return null;

  // Verifica se o texto atualmente sendo lido corresponde a este componente
  const isCurrentText = isSpeaking && activeSpeechText.startsWith(textToRead.trim().slice(0, 30));

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentText) {
      stopSpeaking();
    } else {
      speakText(textToRead);
    }
  };

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isCurrentText ? `Parar de ouvir: ${label}` : `Ouvir em voz alta: ${label}`}
      className={`inline-flex items-center gap-1.5 font-medium rounded-xl border transition-all ${
        isCurrentText
          ? 'bg-blue-700 text-white border-blue-800 shadow-md ring-2 ring-blue-400'
          : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
      } ${isSmall ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'} ${className}`}
    >
      {isCurrentText ? (
        <>
          <VolumeX size={isSmall ? 14 : 16} className="text-white animate-pulse" aria-hidden="true" />
          <span>Parar áudio</span>
        </>
      ) : (
        <>
          <Volume2 size={isSmall ? 14 : 16} className="text-blue-700" aria-hidden="true" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
