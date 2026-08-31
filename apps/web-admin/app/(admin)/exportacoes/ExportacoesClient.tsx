'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  FileSpreadsheet, Download, Loader2, Save, AlertCircle, CheckCircle2, MapPin, History, Info,
} from 'lucide-react';
import { api } from '../../../lib/api-client';

interface UnitOption {
  id: string;
  name: string;
  cityName?: string | null;
  state?: string | null;
}

interface CityRow {
  name: string;
  count: number;
  code: number | null;
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

  const [cities, setCities] = useState<CityRow[]>([]);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [loadingCities, setLoadingCities] = useState(false);
  const [savingCities, setSavingCities] = useState(false);

  const [history, setHistory] = useState<ExportLogRow[]>([]);

  const showBody = isSuper ? !!selectedUnitId : true;
  const unitQs = isSuper && selectedUnitId ? `?unitId=${selectedUnitId}` : '';

  const loadCities = useCallback(async () => {
    if (isSuper && !selectedUnitId) {
      setCities([]);
      setCodes({});
      return;
    }
    setLoadingCities(true);
    try {
      const data = (await api.get(`/export/financeiro/cities${unitQs}`)) as { cities: CityRow[] };
      setCities(data.cities ?? []);
      const initial: Record<string, string> = {};
      (data.cities ?? []).forEach((c) => {
        initial[c.name] = c.code != null ? String(c.code) : c.name === 'VIDEIRA' ? '1' : '';
      });
      setCodes(initial);
    } catch {
      setCities([]);
    } finally {
      setLoadingCities(false);
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
    loadCities();
    loadHistory();
  }, [loadCities, loadHistory]);

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

  async function saveCities() {
    setError('');
    setMsg('');
    setSavingCities(true);
    try {
      const codesNum: Record<string, number> = {};
      for (const [k, v] of Object.entries(codes)) {
        if (v.trim() !== '' && Number.isFinite(Number(v))) codesNum[k] = Number(v);
      }
      await api.put('/export/financeiro/cities', {
        unitId: isSuper ? selectedUnitId : undefined,
        codes: codesNum,
      });
      setMsg('Códigos de cidade salvos!');
      loadCities();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar os códigos.');
    } finally {
      setSavingCities(false);
    }
  }

  const missingCityCodes = cities.filter((c) => !codes[c.name] || codes[c.name].trim() === '').length;

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

            {missingCityCodes > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-start gap-2 text-xs text-amber-800">
                <Info size={15} className="shrink-0 mt-0.5" />
                <span>
                  <strong>{missingCityCodes}</strong> cidade(s) sem código definido — essas linhas sairão com o
                  campo <em>codCidade</em> em branco. Preencha abaixo em “Códigos de cidade”.
                </span>
              </div>
            )}
          </div>

          {/* Card: De-para de cidades */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <MapPin size={22} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Códigos de cidade (de-para)</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Código numérico de cada cidade no sistema financeiro (coluna <em>codCidade</em>). Videira = 1.
                </p>
              </div>
            </div>

            {loadingCities ? (
              <p className="text-sm text-slate-400 py-4 text-center">Carregando cidades…</p>
            ) : cities.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Nenhuma cidade encontrada nas empresas desta unidade.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                        <th className="px-4 py-2.5 text-left font-semibold">Cidade</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Empresas</th>
                        <th className="px-4 py-2.5 text-left font-semibold w-40">Código</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cities.map((c) => (
                        <tr key={c.name}>
                          <td className="px-4 py-2 font-medium text-slate-800">{c.name}</td>
                          <td className="px-4 py-2 text-right text-slate-500 tabular-nums">{c.count}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={codes[c.name] ?? ''}
                              onChange={(e) => setCodes((prev) => ({ ...prev, [c.name]: e.target.value }))}
                              placeholder="—"
                              className="w-28 h-9 px-2 rounded-lg border border-slate-200 text-sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={saveCities}
                  disabled={savingCities}
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg text-sm px-6 h-10 disabled:opacity-50"
                >
                  <Save size={16} /> {savingCities ? 'Salvando…' : 'Salvar códigos'}
                </button>
              </>
            )}
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
