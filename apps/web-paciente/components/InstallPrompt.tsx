'use client';

import { useEffect, useState } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 dias

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    if (isIOS()) {
      setShowIosHint(true);
      setHidden(false);
    }

    const onInstalled = () => {
      setInstallEvent(null);
      setHidden(true);
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setHidden(true);
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallEvent(null);
      setHidden(true);
    } else {
      dismiss();
    }
  }

  if (hidden) return null;

  if (showIosHint) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-40 safe-bottom">
        <button
          onClick={dismiss}
          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-700"
          aria-label="Dispensar"
        >
          <X size={16} />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#007178]/10 flex items-center justify-center shrink-0">
            <Plus size={18} className="text-[#007178]" />
          </div>
          <div className="flex-1 pr-6">
            <p className="text-sm font-bold text-slate-800">Instalar a carteirinha</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Toque em <Share size={12} className="inline -mt-1" /> Compartilhar e depois em &ldquo;Adicionar à Tela de Início&rdquo;.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-40 safe-bottom">
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-700"
        aria-label="Dispensar"
      >
        <X size={16} />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#007178]/10 flex items-center justify-center shrink-0">
          <Download size={18} className="text-[#007178]" />
        </div>
        <div className="flex-1 pr-6">
          <p className="text-sm font-bold text-slate-800">Instalar carteirinha digital</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Acesse rápido pelo seu celular, mesmo offline.
          </p>
          <button
            onClick={install}
            className="mt-3 w-full bg-[#007178] hover:bg-[#005f65] text-white font-bold text-sm py-2 rounded-xl"
          >
            Instalar agora
          </button>
        </div>
      </div>
    </div>
  );
}
