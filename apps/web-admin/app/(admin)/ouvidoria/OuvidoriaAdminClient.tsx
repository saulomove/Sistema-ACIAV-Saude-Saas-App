'use client';

import { useCallback, useEffect, useState } from 'react';
import { Megaphone, X, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api-client';

interface OuvidoriaItem {
  id: string;
  unitId: string;
  nome: string;
  cpf: string | null;
  categoria: string;
  assunto: string;
  mensagem: string;
  status: string;
  createdAt: string;
}

interface ListResponse {
  items: OuvidoriaItem[];
  total: number;
  abertas: number;
  page: number;
  limit: number;
}

const CATEGORIA_LABELS: Record<string, { label: string; className: string }> = {
  reclamacao: { label: 'Reclamação', className: 'bg-red-50 text-red-700' },
  sugestao: { label: 'Sugestão', className: 'bg-blue-50 text-blue-700' },
  elogio: { label: 'Elogio', className: 'bg-emerald-50 text-emerald-700' },
  duvida: { label: 'Dúvida', className: 'bg-amber-50 text-amber-700' },
};

const STATUS_TABS = [
  { value: 'aberta', label: 'Abertas' },
  { value: 'resolvida', label: 'Resolvidas' },
  { value: '', label: 'Todas' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function categoriaBadge(cat: string) {
  const def = CATEGORIA_LABELS[cat] ?? { label: cat, className: 'bg-slate-100 text-slate-600' };
  return <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${def.className}`}>{def.label}</span>;
}

function statusBadge(status: string) {
  return status === 'resolvida' ? (
    <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded bg-emerald-50 text-emerald-700">Resolvida</span>
  ) : (
    <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded bg-orange-50 text-orange-700">Aberta</span>
  );
}

export default function OuvidoriaAdminClient({ role }: { role: string }) {
  const [items, setItems] = useState<OuvidoriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [abertas, setAbertas] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;
  const [status, setStatus] = useState('aberta');
  const [selected, setSelected] = useState<OuvidoriaItem | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (status) qs.set('status', status);
    qs.set('page', String(page));
    qs.set('limit', String(limit));
    try {
      const res = await fetch(`/internal/api/ouvidoria?${qs.toString()}`);
      if (!res.ok) throw new Error('Falha ao carregar as manifestações.');
      const data: ListResponse = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setAbertas(data.abertas ?? 0);
      setError('');
    } catch (e) {
      setItems([]);
      setTotal(0);
      setError(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function toggleStatus(item: OuvidoriaItem) {
    const next = item.status === 'resolvida' ? 'aberta' : 'resolvida';
    setUpdatingId(item.id);
    setError('');
    try {
      await api.patch(`/ouvidoria/${item.id}/status`, { status: next });
      setSelected((s) => (s && s.id === item.id ? { ...s, status: next } : s));
      await fetchItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível atualizar o status.');
    } finally {
      setUpdatingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Megaphone size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ouvidoria</h1>
          <p className="text-sm text-slate-500">
            Manifestações enviadas pelos beneficiários ({role === 'super_admin' ? 'visão global' : 'sua unidade'})
            {abertas > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                {abertas} aberta{abertas !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
        {/* Tabs de status */}
        <div className="flex gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setPage(1);
                setStatus(tab.value);
              }}
              className={
                'px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors border ' +
                (status === tab.value
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        <div className="overflow-x-auto -mx-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-semibold">Data</th>
                <th className="px-4 py-3 text-left font-semibold">Beneficiário</th>
                <th className="px-4 py-3 text-left font-semibold">Categoria</th>
                <th className="px-4 py-3 text-left font-semibold">Assunto</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Carregando...
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Nenhuma manifestação encontrada.
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{item.nome}</div>
                      {item.cpf && <div className="text-xs text-slate-400">{item.cpf}</div>}
                    </td>
                    <td className="px-4 py-3">{categoriaBadge(item.categoria)}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{item.assunto}</td>
                    <td className="px-4 py-3">{statusBadge(item.status)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelected(item)}
                        className="text-primary hover:underline text-xs font-semibold mr-3"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => toggleStatus(item)}
                        disabled={updatingId === item.id}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40"
                      >
                        {item.status === 'resolvida' ? 'Reabrir' : 'Resolver'}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {total} manifestaç{total !== 1 ? 'ões' : 'ão'} · página {page} de {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelected(null)}>
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Manifestação</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex items-center gap-2">
                {categoriaBadge(selected.categoria)}
                {statusBadge(selected.status)}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">Beneficiário</div>
                <div className="text-slate-800">
                  {selected.nome}
                  {selected.cpf ? ` · ${selected.cpf}` : ''}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">Data</div>
                <div className="text-slate-800">{formatDate(selected.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">Assunto</div>
                <div className="text-slate-800 font-medium">{selected.assunto}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1">Mensagem</div>
                <p className="bg-slate-50 rounded-lg p-3 text-slate-700 whitespace-pre-line border border-slate-100">
                  {selected.mensagem}
                </p>
              </div>
              <button
                onClick={() => toggleStatus(selected)}
                disabled={updatingId === selected.id}
                className={
                  'w-full inline-flex items-center justify-center gap-2 font-bold px-5 py-3 rounded-xl text-sm transition-colors disabled:opacity-50 ' +
                  (selected.status === 'resolvida'
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600')
                }
              >
                {selected.status === 'resolvida' ? (
                  <>
                    <RotateCcw size={16} /> Reabrir manifestação
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Marcar como resolvida
                  </>
                )}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
