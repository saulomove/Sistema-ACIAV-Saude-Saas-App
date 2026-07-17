'use client';

import { useEffect } from 'react';

const CHUNK_ERROR = /ChunkLoadError|Loading chunk|dynamically imported module|Importing a module script failed/i;

// global-error substitui o layout raiz quando ele próprio falha, então precisa
// de <html>/<body> e usa estilos inline para não depender de nada que possa
// estar quebrado (fontes, CSS, componentes).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError = error?.name === 'ChunkLoadError' || CHUNK_ERROR.test(error?.message ?? '');

  useEffect(() => {
    if (!isChunkError || typeof window === 'undefined') return;
    const KEY = 'aciav_chunk_reload_at';
    const last = Number(sessionStorage.getItem(KEY) ?? '0');
    if (Date.now() - last < 10000) return;
    sessionStorage.setItem(KEY, String(Date.now()));
    window.location.reload();
  }, [isChunkError]);

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f8f9fa' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 400, width: '100%', background: '#fff', borderRadius: 24, border: '1px solid #f1f1f1', padding: 32, textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#e6f3f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>⚠️</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>
              {isChunkError ? 'Atualizando o aplicativo…' : 'Ops, algo deu errado'}
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 8, lineHeight: 1.5 }}>
              {isChunkError
                ? 'Uma nova versão está sendo carregada. Se esta tela permanecer, toque em recarregar.'
                : 'Não foi possível carregar o aplicativo. Tente novamente — seus dados estão seguros.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
              <button onClick={() => reset()} style={{ padding: '12px 20px', borderRadius: 12, background: '#007178', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                Tentar novamente
              </button>
              <button onClick={() => window.location.reload()} style={{ padding: '12px 20px', borderRadius: 12, background: '#fff', color: '#64748b', fontWeight: 500, fontSize: 14, border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                Recarregar página
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
