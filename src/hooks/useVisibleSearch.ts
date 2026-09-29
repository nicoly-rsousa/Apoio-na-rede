import { useEffect, useRef } from 'react';

/** Follow the visible viewport as a mobile keyboard opens, without moving focus. */
export function useVisibleSearch() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    let frame = 0;
    let timer = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (document.activeElement !== input || !matchMedia('(max-width: 1023px)').matches) return;
        const viewport = window.visualViewport;
        const top = viewport?.offsetTop ?? 0;
        const height = viewport?.height ?? window.innerHeight;
        const header = document.querySelector('.app-header')?.getBoundingClientRect().bottom ?? 0;
        const safeTop = Math.max(top, header) + 16;
        const safeBottom = top + height - 24;
        const rect = input.getBoundingClientRect();
        if (rect.top < safeTop || rect.bottom > safeBottom) {
          window.scrollBy({ top: rect.top - safeTop, behavior: 'instant' });
        }
        input.parentElement?.style.setProperty('--suggestion-height', `${Math.max(80, Math.min(320, safeBottom - input.getBoundingClientRect().bottom - 12))}px`);
      });
    };
    const focus = () => { update(); timer = window.setTimeout(update, 350); };
    input.addEventListener('focus', focus);
    window.visualViewport?.addEventListener('resize', update);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      input.removeEventListener('focus', focus);
      window.visualViewport?.removeEventListener('resize', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return ref;
}
