import { browserStorage } from '../../lib/browserStorage';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Check,
  Ear,
  Eye,
  Keyboard,
  MonitorCog,
  MousePointer2,
  Sparkles,
  X,
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { DisabilityType } from '../../types';

const ONBOARDING_KEY = 'apoio_accessibility_onboarding_v1';

type NeedId = 'screen-reader' | 'low-vision' | 'keyboard' | 'reading' | 'sensory' | 'libras' | 'mobility';

const NEEDS: Array<{ id: NeedId; title: string; description: string; icon: React.ElementType }> = [
  { id: 'screen-reader', title: 'Uso leitor de tela', description: 'Prioriza listas, atalhos e evita leitura de voz duplicada.', icon: MonitorCog },
  { id: 'low-vision', title: 'Preciso enxergar melhor', description: 'Aumenta os textos e prioriza recursos para baixa visão.', icon: Eye },
  { id: 'keyboard', title: 'Navego pelo teclado', description: 'Reforça o indicador de foco em links, campos e botões.', icon: Keyboard },
  { id: 'reading', title: 'Prefiro leitura facilitada', description: 'Ativa uma fonte mais legível e textos maiores.', icon: BookOpen },
  { id: 'sensory', title: 'Quero menos estímulos', description: 'Reduz animações, transições e efeitos visuais.', icon: Sparkles },
  { id: 'libras', title: 'Uso Libras', description: 'Prioriza locais com recursos para pessoas surdas.', icon: Ear },
  { id: 'mobility', title: 'Preciso de acesso físico', description: 'Prioriza rampas, circulação e banheiros adaptados.', icon: MousePointer2 },
];

export const AccessibilityOnboarding: React.FC = () => {
  const { applySettings, setAccessibilityPreferences } = useAccessibility();
  const [isOpen, setIsOpen] = useState(() => !browserStorage.getItem(ONBOARDING_KEY));
  const [selected, setSelected] = useState<NeedId[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const openOnboarding = () => setIsOpen(true);
    window.addEventListener('open-accessibility-onboarding', openOnboarding);
    return () => window.removeEventListener('open-accessibility-onboarding', openOnboarding);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const selector = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>(selector)?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        browserStorage.setItem(ONBOARDING_KEY, 'completed');
        setIsOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(selector));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const finish = () => {
    browserStorage.setItem(ONBOARDING_KEY, 'completed');
    setIsOpen(false);
  };

  const applyPreferences = async () => {
    setIsApplying(true);
    const nextSettings: Parameters<typeof applySettings>[0] = {};
    const disabilityPreferences = new Set<DisabilityType>();

    if (selected.includes('screen-reader')) {
      nextSettings.preferredView = 'list';
      nextSettings.voiceReadingEnabled = false;
      nextSettings.enhancedFocus = true;
      disabilityPreferences.add('visual');
    }
    if (selected.includes('low-vision')) {
      nextSettings.fontSize = 'lg';
      nextSettings.enhancedFocus = true;
      disabilityPreferences.add('visual');
    }
    if (selected.includes('keyboard')) nextSettings.enhancedFocus = true;
    if (selected.includes('reading')) {
      nextSettings.fontSize = 'lg';
      nextSettings.dyslexicFont = true;
    }
    if (selected.includes('sensory')) nextSettings.reducedSensory = true;
    if (selected.includes('libras')) disabilityPreferences.add('auditiva');
    if (selected.includes('mobility')) disabilityPreferences.add('mobilidade');

    applySettings(nextSettings);
    setAccessibilityPreferences(Array.from(disabilityPreferences));
    setIsApplying(false);
    finish();
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 sm:p-6 backdrop-blur-sm">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="accessibility-welcome-title" className="relative w-full max-w-3xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-8">
        <button type="button" onClick={finish} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Continuar com configuração padrão">
          <X size={20} aria-hidden="true" />
        </button>

        <div className="pr-12">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Configuração inicial</p>
          <h1 id="accessibility-welcome-title" className="mb-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">Como podemos facilitar sua experiência?</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600">Escolha quantas opções quiser. Você poderá alterar tudo depois no menu de acessibilidade.</p>
        </div>

        <div className="my-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {NEEDS.map((need) => {
            const Icon = need.icon;
            const isSelected = selected.includes(need.id);
            return (
              <button key={need.id} type="button" role="checkbox" aria-checked={isSelected} onClick={() => setSelected((items) => items.includes(need.id) ? items.filter((item) => item !== need.id) : [...items, need.id])} className={`flex min-h-24 items-start gap-3 rounded-xl border p-4 text-left transition-colors ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {isSelected ? <Check size={18} aria-hidden="true" /> : <Icon size={19} aria-hidden="true" />}
                </span>
                <span><strong className="block text-sm text-slate-900">{need.title}</strong><span className="mt-1 block text-xs leading-relaxed text-slate-500">{need.description}</span></span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={finish} className="min-h-11 px-4 text-sm font-semibold text-slate-600 hover:text-slate-900">Continuar com o padrão</button>
          <button type="button" onClick={applyPreferences} disabled={selected.length === 0 || isApplying} className="min-h-11 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300">
            {isApplying ? 'Aplicando…' : `Aplicar ${selected.length || ''} ${selected.length === 1 ? 'preferência' : 'preferências'}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
