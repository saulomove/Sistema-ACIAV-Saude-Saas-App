'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Trash2, AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { api } from '../../../lib/api-client';

interface UnitOption {
  id: string;
  name: string;
  cityName?: string | null;
  state?: string | null;
}

interface CagedItem {
  id: string;
  refMonth: string;
  saldo: number | null;
  admissoes: number | null;
  desligamentos: number | null;
  estoque: number | null;
  source: string;
  updatedAt: string;
}

interface CagedData {
  unit: { id: string; name: string; cityName: string | null; state: string | null; ibgeCode: string | null } | null;
  items: CagedItem[];
}

const REF_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function fmtMonth(ref: string): string {
  const [y, m] = ref.split('-');
  return `${m}/${y}`;
}
function fmtInt(n: number | null): string {
  return n === null || n === undefined ? '—' : n.toLocaleString('pt-BR');
}
function fmtSaldo(n: number | null): string {
  if (n === null || n === undefined) return '—';
  return (n > 0 ? '+' : '') + n.toLocaleString('pt-BR');
}

export default function CagedClient({ role, units }: { role: string; units: UnitOption[] }) {
  const isSuper = role === 'super_admin';
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [data, setData] = useState<CagedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refMonth, setRefMonth] = useState('');
  const [saldo, setSaldo] = useState('');
  const [admissoes, setAdmissoes] = useState('');
  const [desligamentos, setDesligamentos] = useState('');
  const [estoque, setEstoque] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (isSuper && !selectedUnitId) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const qs = isSuper ? `?unitId=${selectedUnitId}` : '';
      const res = await fetch(`/internal/api/caged${qs}`);
      if (!res.ok) throw new Error('Falha ao carregar os dados.');
      setData((await res.json()) as CagedData);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isSuper, selectedUnitId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function clearForm() {
    setSaldo('');
    setAdmissoes('');
    setDesligamentos('');
    setEstoque('');
  }

  async function handleSave() {
    setError('');
    setMsg('');
    if (!REF_MONTH_RE.test(refMonth)) {
      setError('Selecione a competência (mês/ano).');
      return;
    }
    const fields = { saldo, admissoes, desligamentos, estoque };
    const filled = Object.values(fields).filter((v) => v.trim() !== '');
    if (filled.length === 0) {
      setError('Preencha ao menos um indicador (saldo, admissões, desligamentos ou estoque).');
      return;
    }
    for (const [k, v] of Object.entries(fields)) {
      if (v.trim() !== '' && (Number.isNaN(Number(v)) || !Number.isInteger(Number(v)))) {
        setError(`Valor inválido em "${k}" (use número inteiro).`);
        return;
      }
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { refMonth };
      if (isSuper) body.unitId = selectedUnitId;
      if (saldo.trim() !== '') body.saldo = Number(saldo);
      if (admissoes.trim() !== '') body.admissoes = Number(admissoes);
      if (desligamentos.trim() !== '') body.desligamentos = Number(desligamentos);
      if (estoque.trim() !== '') body.estoque = Number(estoque);
      await api.post('/caged', body);
      setMsg(`Dados de ${fmtMonth(refMonth)} salvos!`);
      clearForm();
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remover este registro do histórico?')) return;
    setError('');
    try {
      await api.delete(`/caged/${id}`);
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover.');
    }
  }

  const items = data?.items ?? [];
  const unit = data?.unit ?? null;
  const cidade = unit?.cityName ? `${unit.cityName}${unit.state ? '/' + unit.state : ''}` : null;
  const showBody = isSuper ? !!selectedUnitId : true;

  // Tendência: usa saldo se houver; senão estoque.
  const trendKey: 'saldo' | 'estoque' | null = items.some((i) => i.saldo !== null)
    ? 'saldo'
    : items.some((i) => i.estoque !== null)
      ? 'estoque'
      : null;
  const chrono = [...items].reverse();
  const maxAbs = trendKey ? Math.max(1, ...items.map((i) => Math.abs(i[trendKey] ?? 0))) : 1;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Briefcase size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">CAGED — Empregos formais no município</h1>
          <p className="text-sm text-slate-500">Indicadores do Novo CAGED por competência, lançados manualmente.</p>
        </div>
      </div>

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
          Selecione uma unidade acima para lançar e ver o histórico do CAGED.
        </div>
      )}

      {showBody && (
        <>
          {unit && !cidade && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-sm text-amber-800">
              <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                Esta unidade ainda não tem <strong>cidade/UF</strong> cadastrada — os números são salvos mesmo assim, mas o rótulo do município fica vazio.
                {isSuper && (
                  <>
                    {' '}
                    <Link href="/unidades" className="font-bold underline">
                      Cadastrar em Unidades
                    </Link>
                    .
                  </>
                )}
              </div>
            </div>
          )}

          {/* Form de lançamento */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-slate-800">
              Lançar competência {cidade && <span className="text-sm font-medium text-slate-400">· {cidade}</span>}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Competência</label>
                <input type="month" value={refMonth} onChange={(e) => setRefMonth(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Saldo</label>
                <input type="number" value={saldo} onChange={(e) => setSaldo(e.target.value)} placeholder="ex: 52" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Admissões</label>
                <input type="number" value={admissoes} onChange={(e) => setAdmissoes(e.target.value)} placeholder="opcional" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Desligamentos</label>
                <input type="number" value={desligamentos} onChange={(e) => setDesligamentos(e.target.value)} placeholder="opcional" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Estoque (ativos)</label>
                <input type="number" value={estoque} onChange={(e) => setEstoque(e.target.value)} placeholder="opcional" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg text-sm px-6 h-10 disabled:opacity-50">
                <Save size={16} /> {saving ? 'Salvando…' : 'Salvar competência'}
              </button>
              <p className="text-xs text-slate-400">
                Preencha o que a fonte fornecer. <strong>Saldo</strong> = admissões − desligamentos (painel do MTE). <strong>Estoque</strong> = total de funcionários ativos. Relançar a mesma competência sobrescreve.
              </p>
            </div>
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
          </div>

          {/* Tendência */}
          {trendKey && chrono.some((i) => i[trendKey] !== null) && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-slate-800 mb-4">
                Tendência — {trendKey === 'saldo' ? 'saldo do mês' : 'estoque de empregos'}
              </h2>
              <div className="flex items-end gap-2 h-40 overflow-x-auto">
                {chrono.slice(-12).map((it) => {
                  const val = it[trendKey];
                  if (val === null) return null;
                  const h = Math.round((Math.abs(val) / maxAbs) * 100);
                  const pos = val >= 0;
                  return (
                    <div key={it.id} className="flex flex-col items-center justify-end flex-1 min-w-[36px] h-full">
                      <span className={`text-[10px] font-bold mb-1 ${pos ? 'text-emerald-600' : 'text-red-600'}`}>
                        {trendKey === 'saldo' ? fmtSaldo(val) : fmtInt(val)}
                      </span>
                      <div className="w-full flex-1 flex items-end">
                        <div className={`w-full rounded-t ${pos ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ height: `${Math.max(4, h)}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 whitespace-nowrap">{fmtMonth(it.refMonth)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Histórico */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left font-semibold">Competência</th>
                    <th className="px-4 py-3 text-right font-semibold">Estoque</th>
                    <th className="px-4 py-3 text-right font-semibold">Saldo</th>
                    <th className="px-4 py-3 text-right font-semibold">Adm.</th>
                    <th className="px-4 py-3 text-right font-semibold">Deslig.</th>
                    <th className="px-4 py-3 text-left font-semibold">Origem</th>
                    <th className="px-4 py-3 text-right font-semibold">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">Carregando...</td>
                    </tr>
                  )}
                  {!loading && items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">Nenhum dado lançado ainda.</td>
                    </tr>
                  )}
                  {!loading &&
                    items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{fmtMonth(it.refMonth)}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-700">{fmtInt(it.estoque)}</td>
                        <td className={`px-4 py-3 text-right font-bold ${it.saldo === null ? 'text-slate-300' : it.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtSaldo(it.saldo)}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{fmtInt(it.admissoes)}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{fmtInt(it.desligamentos)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{it.source === 'bigquery' ? 'Automático' : 'Manual'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDelete(it.id)} className="text-slate-400 hover:text-red-600" title="Remover">
                            <Trash2 size={16} />
                          </button>
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
