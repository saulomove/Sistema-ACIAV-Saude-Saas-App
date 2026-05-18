'use client';

import { useEffect } from 'react';
import { registerPushIfNative, setupPushListeners } from '../lib/native/push';
import { isNativePlatform } from '../lib/native/capacitor';

/**
 * Monta uma unica vez por sessao logada.
 * No web e' no-op. Em iOS/Android (Capacitor):
 *  1. Desregistra o Service Worker do next-pwa (conflita com WKWebView / Android WebView).
 *  2. Registra o device para push (FCM/APNs) e envia o token ao backend.
 *  3. Plugga listeners de notificacao recebida / tocada.
 */
export default function PushBootstrap() {
  useEffect(() => {
    if (!isNativePlatform()) return;

    // SW do next-pwa nao deve rodar dentro do Capacitor.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister().catch(() => undefined)))
        .catch(() => undefined);
    }

    registerPushIfNative().catch(() => undefined);
    setupPushListeners({
      onTapped: (data) => {
        const path = typeof data?.path === 'string' ? data.path : null;
        if (path && path.startsWith('/portal')) {
          window.location.href = path;
        }
      },
    });
  }, []);

  return null;
}
