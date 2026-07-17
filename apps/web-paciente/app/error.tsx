'use client';

import { useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

const CHUNK_ERROR = /ChunkLoadError|Loading chunk|dynamically imported module|Importing a module script failed/i;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError = error?.name === 'ChunkLoadError' || CHUNK_ERROR.test(error?.message ?? '');

  useEffect(() => {
    if (!isChunkError || typeof window === 'undefined') return;
    // Assets de uma build antiga sumiram após um deploy. Recarrega UMA vez para
    // buscar a versão nova. O timestamp em sessionStorage impede loop de reload.
    const KEY = 'aciav_chunk_reload_at';
    const last = Number(sessionStorage.getItem(KEY) ?? '0');
    if (Date.now() - last < 10000) return;
    sessionStorage.setItem(KEY, String(Date.now()));
    window.location.reload();
  }, [isChunkError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#e6f3f2] text-[#007178] flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={26} />
        </div>
        <h1 className="text-xl font-bold text-slate-800">
          {isChunkError ? 'Atualizando o aplicativo…' : 'Ops, algo deu errado'}
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          {isChunkError
            ? 'Uma nova versão está sendo carregada. Se esta tela permanecer, toque em recarregar.'
            : 'Não foi possível carregar esta tela. Tente novamente — seus dados estão seguros.'}
        </p>
        <div className="flex flex-col gap-2 mt-6">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#007178] hover:bg-[#005f65] text-white font-semibold text-sm transition-colors"
          >
            <RefreshCw size={16} /> Tentar novamente
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm transition-colors"
          >
            Recarregar página
          </button>
        </div>
      </div>
    </div>
  );
}
