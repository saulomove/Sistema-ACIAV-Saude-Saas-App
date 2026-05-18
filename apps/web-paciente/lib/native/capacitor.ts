// Utilitarios de plataforma Capacitor (com fallback seguro pra ambiente web).
// Toda chamada a plugin nativo passa por aqui pra nao quebrar SSR/PWA.

let cachedIsNative: boolean | null = null;

export function isNativePlatform(): boolean {
  if (cachedIsNative !== null) return cachedIsNative;
  if (typeof window === 'undefined') {
    cachedIsNative = false;
    return false;
  }
  try {
    // O global `Capacitor` so existe dentro do WebView do app nativo.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cap = (window as any).Capacitor;
    cachedIsNative = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
  } catch {
    cachedIsNative = false;
  }
  return cachedIsNative;
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cap = (window as any).Capacitor;
    const p = cap?.getPlatform?.();
    if (p === 'ios' || p === 'android') return p;
  } catch {
    /* ignore */
  }
  return 'web';
}
