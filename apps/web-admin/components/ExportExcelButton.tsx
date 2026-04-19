'use client';

import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
  endpoint: 'users' | 'companies' | 'transactions' | 'providers';
  query?: Record<string, string | undefined>;
  label?: string;
  variant?: 'outline' | 'solid';
}

export default function ExportExcelButton({ endpoint, query, label = 'Exportar Excel', variant = 'outline' }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      const qs = new URLSearchParams();
      Object.entries(query ?? {}).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.set(k, v);
      });
      const url = `/internal/download/export/${endpoint}${qs.toString() ? `?${qs.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao exportar');

      const blob = await res.blob();
      const cd = res.headers.get('content-disposition') ?? '';
      const match = /filename="?([^";]+)"?/.exec(cd);
      const filename = match?.[1] ?? `${endpoint}-${new Date().toISOString().slice(0, 10)}.xlsx`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      alert((err as Error).message || 'Erro ao exportar');
    } finally {
      setBusy(false);
    }
  }

  const className =
    variant === 'solid'
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 disabled:opacity-60'
      : 'bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 disabled:opacity-60';

  return (
    <button onClick={handleClick} disabled={busy} className={className}>
      {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      {busy ? 'Exportando...' : label}
    </button>
  );
}
