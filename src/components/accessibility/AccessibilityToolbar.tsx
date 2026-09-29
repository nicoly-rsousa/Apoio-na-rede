import React, { useState, useEffect, useRef } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import {
  Sliders,
  Type,
  SunMoon,
  Volume2,
  Sparkles,
  RotateCcw,
  X,
  BookOpen,
} from 'lucide-react';

export const AccessibilityToolbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    document.querySelector<HTMLElement>('#accessibility-menu button')?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setIsOpen(false); launcherRef.current?.focus(); }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);
  const {
    settings,
    applySettings,
    setFontSize,
    setHighContrast,
    toggleDyslexicFont,
    toggleReducedSensory,
    stopSpeaking,
    isSpeaking,
    speakText,
    speechError,
  } = useAccessibility();

  const resetAll = () => {
    applySettings({
      fontSize: 'md',
      highContrast: 'default',
      dyslexicFont: false,
      reducedSensory: false,
      voiceReadingEnabled: true,
      preferredView: 'map',
      enhancedFocus: false,
    });
    stopSpeaking();
  };

  return (
    <>
      {/* Botão Flutuante de Acessibilidade */}
      <div className="accessibility-launcher fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        {speechError && (
          <p role="alert" className="max-w-xs rounded-xl bg-white text-slate-900 border border-slate-300 p-3 text-sm shadow-md">
            {speechError}
          </p>
        )}
        {isSpeaking && (
          <div className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md text-sm font-semibold">
            <Volume2 size={18} aria-hidden="true" />
            <span>Lendo em voz alta...</span>
            <button
              type="button"
              onClick={stopSpeaking}
              className="ml-2 bg-blue-900 hover:bg-blue-950 text-white px-2 py-0.5 rounded-full text-xs"
              aria-label="Parar leitura em voz alta"
            >
              Parar
            </button>
          </div>
        )}

        <button
          ref={launcherRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="accessibility-menu"
          aria-label="Abrir menu de recursos de acessibilidade e visualização"
          className="premium-button flex items-center gap-2 p-3.5 sm:px-5 sm:py-3.5 text-white font-bold rounded-full border border-white/70 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400"
        >
          <Sliders size={20} aria-hidden="true" />
          <span className="hidden sm:inline text-sm font-bold tracking-wide">Acessibilidade</span>
        </button>
      </div>

      {/* Menu Modal/Drawer de Ajustes */}
      {isOpen && (
        <div
          id="accessibility-menu"
          role="region"
          aria-label="Painel de Ferramentas de Acessibilidade"
          className="accessibility-panel premium-surface fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-88 rounded-2xl p-6 text-slate-800 animate-fadeIn"
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-2 text-blue-800 font-extrabold">
              <Sliders size={20} aria-hidden="true" />
              <h2 className="text-base font-bold text-slate-900">Ajustes de Acessibilidade</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              aria-label="Fechar menu de acessibilidade"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-5 text-sm">
            <label className="flex items-center gap-3 font-bold">
              <input type="checkbox" checked={settings.voiceReadingEnabled} onChange={event => applySettings({ voiceReadingEnabled: event.target.checked })} />
              Leitura em voz alta
            </label>
            {settings.voiceReadingEnabled && (
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) stopSpeaking();
                  else speakText(document.getElementById('main-content')?.innerText ?? '');
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-700 text-white px-4 py-2 font-bold"
              >
                <Volume2 size={18} aria-hidden="true" />
                {isSpeaking ? 'Parar leitura' : 'Ouvir página'}
              </button>
            )}
            {/* 1. Tamanho do Texto */}
            <div>
              <label className="flex items-center gap-1.5 font-bold text-slate-700 mb-2">
                <Type size={16} aria-hidden="true" />
                <span>Tamanho da Fonte</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1.5 rounded-xl">
                {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFontSize(size)}
                    aria-pressed={settings.fontSize === size}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      settings.fontSize === size
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {size === 'sm' && 'Pequeno'}
                    {size === 'md' && 'Padrão'}
                    {size === 'lg' && 'Grande'}
                    {size === 'xl' && 'Extra'}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Alto Contraste */}
            <div>
              <label className="flex items-center gap-1.5 font-bold text-slate-700 mb-2">
                <SunMoon size={16} aria-hidden="true" />
                <span>Contraste Visual</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setHighContrast('default')}
                  aria-pressed={settings.highContrast === 'default'}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                    settings.highContrast === 'default'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setHighContrast('dark')}
                  aria-pressed={settings.highContrast === 'dark'}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all bg-slate-950 text-white ${
                    settings.highContrast === 'dark'
                      ? 'border-white ring-2 ring-white'
                      : 'border-slate-700 hover:bg-black'
                  }`}
                >
                  Alto Contraste
                </button>
                <button
                  type="button"
                  onClick={() => setHighContrast('yellow-black')}
                  aria-pressed={settings.highContrast === 'yellow-black'}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all bg-black text-yellow-300 ${
                    settings.highContrast === 'yellow-black'
                      ? 'border-yellow-300 ring-2 ring-yellow-300'
                      : 'border-yellow-500/50 hover:bg-slate-900'
                  }`}
                >
                  Amarelo/Preto
                </button>
              </div>
            </div>

            {/* 3. Fonte Amigável para Dislexia */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-blue-700" aria-hidden="true" />
                <div>
                  <div className="font-bold text-slate-800 text-xs">Fonte para Dislexia</div>
                  <div className="text-xs text-slate-500">Tipografia Lexend de alta legibilidade</div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.dyslexicFont}
                onClick={toggleDyslexicFont}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.dyslexicFont ? 'bg-blue-700' : 'bg-slate-300'
                }`}
                aria-label="Ativar fonte amigável para dislexia"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.dyslexicFont ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 4. Baixo Estímulo Sensorial (TEA / Neurodivergência) */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-700" aria-hidden="true" />
                <div>
                  <div className="font-bold text-slate-800 text-xs">Baixo Estímulo Sensorial</div>
                  <div className="text-xs text-slate-500">Desativa animações e efeitos para TEA</div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.reducedSensory}
                onClick={toggleReducedSensory}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.reducedSensory ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                aria-label="Ativar modo de baixo estímulo sensorial"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.reducedSensory ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Botão de Reset */}
            <div className="pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  window.dispatchEvent(new Event('open-accessibility-onboarding'));
                }}
                className="w-full flex items-center justify-center gap-2 py-2 mb-2 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                <Sliders size={14} aria-hidden="true" />
                <span>Refazer configuração guiada</span>
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <RotateCcw size={14} aria-hidden="true" />
                <span>Restaurar configurações padrão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
