'use client';

import { getPlatform, isNativePlatform } from './capacitor';

/**
 * Registra o device para receber push notifications via FCM/APNs e envia o token ao backend.
 *
 * Comportamento:
 * - Em web: no-op.
 * - Em iOS/Android (Capacitor): pede permissao, registra com FCM/APNs e POSTa o token em /internal/api/push/token.
 *
 * Deve ser chamado apos o login bem-sucedido (ou no mount de uma rota autenticada).
 */
export async function registerPushIfNative(): Promise<{ registered: boolean; reason?: string }> {
  if (!isNativePlatform()) {
    return { registered: false, reason: 'web' };
  }

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // 1. Permissao
    const permission = await PushNotifications.checkPermissions();
    let status = permission.receive;
    if (status === 'prompt' || status === 'prompt-with-rationale') {
      const req = await PushNotifications.requestPermissions();
      status = req.receive;
    }
    if (status !== 'granted') {
      return { registered: false, reason: 'permission-denied' };
    }

    // 2. Registrar (gera token e dispara o evento `registration`)
    await PushNotifications.register();

    // 3. Aguardar o token via listener
    const platform = getPlatform();
    const token = await new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => resolve(null), 15000);
      PushNotifications.addListener('registration', (t) => {
        clearTimeout(timeout);
        resolve(t.value);
      });
      PushNotifications.addListener('registrationError', () => {
        clearTimeout(timeout);
        resolve(null);
      });
    });

    if (!token) {
      return { registered: false, reason: 'no-token' };
    }

    // 4. Mandar pro backend
    const res = await fetch('/internal/api/push/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        platform,
        deviceLabel: navigator.userAgent.slice(0, 80),
      }),
    });
    if (!res.ok) {
      return { registered: false, reason: `backend-${res.status}` };
    }

    return { registered: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    return { registered: false, reason: `error-${message}` };
  }
}

/**
 * Listeners de notificacao recebida (foreground) e clique em notificacao.
 * Setup uma vez na montagem da home do portal.
 */
export async function setupPushListeners(opts: {
  onReceived?: (notification: { title?: string; body?: string; data?: Record<string, unknown> }) => void;
  onTapped?: (data: Record<string, unknown>) => void;
}): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    if (opts.onReceived) {
      PushNotifications.addListener('pushNotificationReceived', (n) => {
        opts.onReceived?.({
          title: n.title,
          body: n.body,
          data: n.data as Record<string, unknown>,
        });
      });
    }
    if (opts.onTapped) {
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        opts.onTapped?.(action.notification.data as Record<string, unknown>);
      });
    }
  } catch {
    /* plugin nao disponivel — ignora */
  }
}
