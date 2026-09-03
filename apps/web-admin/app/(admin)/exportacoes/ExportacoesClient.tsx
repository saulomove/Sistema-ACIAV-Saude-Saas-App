'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  FileSpreadsheet, Download, Loader2, AlertCircle, CheckCircle2, History,
} from 'lucide-react';
import { api } from '../../../lib/api-client';

interface UnitOption {
  id: string;
  name: string;
  cityName?: string | null;
  state?: string | null;
}

interface PendingInfo {
  empresasSemCodigo: string[];
  empresasSemPlano: string[];
  empresasSemEndereco: string[];
  beneficiariosSemCodigo: string[];
  beneficiariosSemSexo: number;
}

interface ExportLogRow {
  id: string;
  type: string;
  actorName: string | null;
  actorRole: string | null;
  filters: string | null;
  rowCount: number;
  excludedCount: number;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Somente ativos',
  inactive: 'Somente inativos',
  all: 'Todos (ativos + inativos)',
};

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function describeFilters(filters: string | null): string {
  if (!filters) return '—';
  try {
    const f = JSON.parse(filters) as { status?: string };
    return STATUS_LABEL[f.status ?? 'active'] ?? (f.status ?? '—');
  } catch {
    return '—';
  }
}

export default function ExportacoesClient({ role, units }: { role: string; units: UnitOption[] }) {
  const isSuper = role === 'super_admin';
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [status, setStatus] = useState('active');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const [history, setHistory] = useState<ExportLogRow[]>([]);
  const [pending, setPending] = useState<PendingInfo | null>(null);

  const showBody = isSuper ? !!selectedUnitId : true;
  const unitQs = isSuper && selectedUnitId ? `?unitId=${selectedUnitId}` : '';

  const loadPending = useCallback(async () => {
    if (isSuper && !selectedUnitId) {
      setPending(null);
      return;
    }
    try {
      setPending((await api.get(`/export/financeiro/pending${unitQs}`)) as PendingInfo | null);
    } catch {
      setPending(null);
    }
  }, [isSuper, selectedUnitId, unitQs]);

  const loadHistory = useCallback(async () => {
    if (isSuper && !selectedUnitId) {
      setHistory([]);
      return;
    }
    try {
      const data = (await api.get(`/export/history${unitQs}`)) as ExportLogRow[];
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    }
  }, [isSuper, selectedUnitId, unitQs]);

  useEffect(() => {
    loadHistory();
    loadPending();
  }, [loadHistory, loadPending]);

  async function downloadFinanceiro() {
    if (busy) return;
    setError('');
    setMsg('');
    if (isSuper && !selectedUnitId) {
      setError('Selecione uma unidade.');
      return;
    }
    setBusy(true);
    try {
      const qs = new URLSearchParams();
      if (isSuper && selectedUnitId) qs.set('unitId', selectedUnitId);
      qs.set('status', status);
      const res = await fetch(`/internal/download/export/financeiro?${qs.toString()}`);
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(j.message || 'Falha ao gerar o arquivo.');
      }
      const blob = await res.blob();
      const cd = res.headers.get('content-disposition') ?? '';
      const match = /filename="?([^";]+)"?/.exec(cd);
      const filename = match?.[1] ?? `export-financeiro-${new Date().toISOString().slice(0, 10)}.xlsx`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
      setMsg('Exportação gerada! O download começou.');
      loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao exportar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <FileSpreadsheet size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Exportações</h1>
          <p className="text-sm text-slate-500">Gere arquivos para sistemas externos, no formato exigido.</p>
        </div>
      </div>

      {/* Seletor de unidade (super_admin) */}
      {isSuper && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Unidade</label>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="w-full md:w-96 h-10 px-3 rounded-lg border border-slate-200 text-sm"
          >
            <option value="">Selecione uma unidade…</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
                {u.cityName ? ` — ${u.cityName}${u.state ? '/' + u.state : ''}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {!showBody && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-slate-400">
          Selecione uma unidade acima para gerar exportações.
        </div>
      )}

      {showBody && (
        <>
          {/* Mensagens */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-2.5 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}
          {msg && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-lg px-4 py-2.5 flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" /> {msg}
            </div>
          )}

          {/* Painel de pendências da cobrança */}
          {pending &&
            (pending.empresasSemCodigo.length > 0 ||
              pending.empresasSemPlano.length > 0 ||
              pending.empresasSemEndereco.length > 0 ||
              pending.beneficiariosSemCodigo.length > 0 ||
              pending.beneficiariosSemSexo > 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 space-y-2">
                <p className="font-bold flex items-center gap-2">
                  <AlertCircle size={16} /> Pendências que afetam a exportação de cobrança
                </p>
                <ul className="space-y-1.5 text-[13px]">
                  {pending.empresasSemCodigo.length > 0 && (
                    <li>
                      <details>
                        <summary className="cursor-pointer">
                          <b>{pending.empresasSemCodigo.length}</b> empresa(s) sem código externo — <b>ficam fora do arquivo</b>
                        </summary>
                        <p className="mt-1 pl-4 text-amber-800">{pending.empresasSemCodigo.join(' · ')}</p>
                      </details>
                    </li>
                  )}
                  {pending.empresasSemPlano.length > 0 && (
                    <li>
                      <details>
                        <summary className="cursor-pointer">
                          <b>{pending.empresasSemPlano.length}</b> empresa(s) sem plano/valor — saem com VALOR_PLANO vazio
                        </summary>
                        <p className="mt-1 pl-4 text-amber-800">{pending.empresasSemPlano.join(' · ')}</p>
                      </details>
                    </li>
                  )}
                  {pending.empresasSemEndereco.length > 0 && (
                    <li>
                      <details>
                        <summary className="cursor-pointer">
                          <b>{pending.empresasSemEndereco.length}</b> empresa(s) com endereço incompleto (rua/CEP/cidade)
                        </summary>
                        <p className="mt-1 pl-4 text-amber-800">{pending.empresasSemEndereco.join(' · ')}</p>
                      </details>
                    </li>
                  )}
                  {pending.beneficiariosSemCodigo.length > 0 && (
                    <li>
                      <details>
                        <summary className="cursor-pointer">
                          <b>{pending.beneficiariosSemCodigo.length}</b> beneficiário(s) sem código externo — <b>ficam fora do arquivo</b>
                        </summary>
                        <p className="mt-1 pl-4 text-amber-800">{pending.beneficiariosSemCodigo.join(' · ')}</p>
                      </details>
                    </li>
                  )}
                  {pending.beneficiariosSemSexo > 0 && (
                    <li>
                      <b>{pending.beneficiariosSemSexo}</b> beneficiário(s) sem sexo — saem como &quot;N&quot;
                    </li>
                  )}
                </ul>
                <p className="text-xs text-amber-700">Corrija nos cadastros de Empresas/Beneficiários — a lista atualiza sozinha.</p>
              </div>
            )}

          {/* Card: Exportação Financeiro (Cobrança) */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Exportação Financeiro (Cobrança)</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Beneficiários (titulares + dependentes) no formato exato exigido pelo sistema de cobrança.
                  Beneficiários e empresas <strong>sem código externo</strong> são excluídos automaticamente.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Situação</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full sm:w-64 h-10 px-3 rounded-lg border border-slate-200 text-sm"
                >
                  <option value="active">Somente ativos</option>
                  <option value="inactive">Somente inativos</option>
                  <option value="all">Todos (ativos + inativos)</option>
                </select>
              </div>
              <button
                onClick={downloadFinanceiro}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm px-6 h-10 disabled:opacity-50"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {busy ? 'Gerando…' : 'Gerar e baixar'}
              </button>
            </div>

          </div>

          {/* Card: Histórico */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <History size={18} className="text-slate-400" />
              <h2 className="font-bold text-slate-800">Histórico de exportações</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left font-semibold">Quando</th>
                    <th className="px-4 py-3 text-left font-semibold">Por</th>
                    <th className="px-4 py-3 text-left font-semibold">Filtro</th>
                    <th className="px-4 py-3 text-right font-semibold">Linhas</th>
                    <th className="px-4 py-3 text-right font-semibold">Excluídos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Nenhuma exportação registrada ainda.</td>
                    </tr>
                  )}
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{fmtDateTime(h.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-500">{h.actorName ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{describeFilters(h.filters)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-700 tabular-nums">{h.rowCount.toLocaleString('pt-BR')}</td>
                      <td className={`px-4 py-3 text-right tabular-nums ${h.excludedCount > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                        {h.excludedCount.toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
