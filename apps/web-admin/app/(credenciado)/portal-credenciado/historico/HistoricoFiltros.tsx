'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';

function monthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

export default function HistoricoFiltros({ initialStart, initialEnd }: { initialStart: string; initialEnd: string }) {
  const router = useRouter();
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);

  function apply(nextStart: string, nextEnd: string) {
    const url = new URL(window.location.href);
    if (nextStart) url.searchParams.set('startDate', nextStart); else url.searchParams.delete('startDate');
    if (nextEnd) url.searchParams.set('endDate', nextEnd); else url.searchParams.delete('endDate');
    router.push(url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : ''));
  }

  function applyMonth(offset: number) {
    const r = monthRange(offset);
    setStart(r.start);
    setEnd(r.end);
    apply(r.start, r.end);
  }

  function clear() {
    setStart('');
    setEnd('');
    apply('', '');
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-end gap-3">
      <Filter size={16} className="text-slate-400 mb-2" />
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1">
          <Calendar size={12} /> De
        </label>
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178]"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1">
          <Calendar size={12} /> Até
        </label>
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178]"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => apply(start, end)}
          className="bg-[#007178] hover:bg-[#005f65] text-white text-xs font-bold px-4 py-2 rounded-lg"
        >
          Aplicar
        </button>
        <button
          onClick={() => applyMonth(0)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg"
        >
          Mês atual
        </button>
        <button
          onClick={() => applyMonth(-1)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg"
        >
          Mês anterior
        </button>
        {(start || end) && (
          <button
            onClick={clear}
            className="text-slate-500 hover:text-slate-700 text-xs font-bold px-3 py-2"
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}
