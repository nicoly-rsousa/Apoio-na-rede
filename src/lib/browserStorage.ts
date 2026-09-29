// Keep the current session usable when browser persistence is unavailable.
const memory = new Map<string, string | null>();
let temporary = false;
function markTemporary() {
  if (temporary) return;
  temporary = true;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('storage-unavailable'));
}
export const browserStorage = {
  isTemporary: () => temporary,
  getItem(key: string): string | null {
    if (memory.has(key)) return memory.get(key)!;
    try { return localStorage.getItem(key); } catch { markTemporary(); return null; }
  },
  setItem(key: string, value: string) {
    memory.set(key, value);
    try { localStorage.setItem(key, value); } catch { markTemporary(); }
  },
  removeItem(key: string) {
    memory.set(key, null);
    try { localStorage.removeItem(key); } catch { markTemporary(); }
  },
};
export function readStoredArray<T>(key: string, fallback: T[] = []): T[] {
  try {
    const raw = browserStorage.getItem(key);
    const value: unknown = raw ? JSON.parse(raw) : fallback;
    return Array.isArray(value) ? value : fallback;
  } catch { return fallback; }
}
