'use client';

import { useMemo, useState } from 'react';
import {
  Search, X, Download, Printer, Loader2, Filter,
  Building2, User, Pill, Heart, FlaskConical, Store, Dumbbell, Sparkles,
  Phone, MessageCircle, MapPin,
} from 'lucide-react';

type EntityType = 'professional' | 'clinic' | 'pharmacy' | 'hospital' | 'lab' | 'store' | 'gym' | 'wellness';
type StatusFilter = 'active' | 'inactive' | 'all';

const TYPE_BADGE: Record<EntityType, { label: string; cls: string; Icon: typeof User }> = {
  professional: { label: 'Profissional', cls: 'bg-blue-50 text-blue-700 border border-blue-100',          Icon: User },
  clinic:       { label: 'Clínica',      cls: 'bg-teal-50 text-teal-700 border border-teal-100',          Icon: Building2 },
  pharmacy:     { label: 'Farmácia',     cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100', Icon: Pill },
  hospital:     { label: 'Hospital',     cls: 'bg-red-50 text-red-700 border border-red-100',             Icon: Heart },
  lab:          { label: 'Laboratório',  cls: 'bg-purple-50 text-purple-700 border border-purple-100',   Icon: FlaskConical },
  store:        { label: 'Loja',         cls: 'bg-amber-50 text-amber-700 border border-amber-100',      Icon: Store },
  gym:          { label: 'Academia',     cls: 'bg-orange-50 text-orange-700 border border-orange-100',   Icon: Dumbbell },
  wellness:     { label: 'Bem-estar',    cls: 'bg-pink-50 text-pink-700 border border-pink-100',         Icon: Sparkles },
};

const TYPE_ORDER: EntityType[] = [
  'professional', 'clinic', 'pharmacy', 'hospital', 'lab', 'store', 'gym', 'wellness',
];

interface Provider {
  id: string;
  name: string;
  professionalName?: string | null;
  clinicName?: string | null;
  category: string;
  specialty?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  registration?: string | null;
  status?: boolean;
  entityType?: EntityType;
}

interface Props {
  providers: Provider[];
  cities: string[];
  categories: string[];
  unitId: string;
}

function deriveEntityType(p: { professionalName?: string | null; category?: string | null }): EntityType {
  if (p.professionalName?.trim()) return 'professional';
  const c = (p.category ?? '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  if (c.includes('farmacia')) return 'pharmacy';
  if (c.includes('hospital')) return 'hospital';
  if (c.includes('exames laboratoriais') || c.includes('laboratorio')) return 'lab';
  if (c.includes('otica') || c.includes('produtos naturais') || c.includes('suplementos')) return 'store';
  if (c.includes('academia')) return 'gym';
  if (c.includes('estetica') || c.includes('bem-estar')) return 'wellness';
  return 'clinic';
}

function getDisplayName(p: Provider): string {
  return p.professionalName?.trim() || p.clinicName?.trim() || p.name;
}

export default function RedeCredenciadaClient({ providers, cities, categories, unitId }: Props) {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [activeTypes, setActiveTypes] = useState<Set<EntityType>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [exporting, setExporting] = useState(false);

  function toggleType(t: EntityType) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  const filtered = useMemo(() => {
    let result = providers;

    if (statusFilter === 'active') result = result.filter((p) => p.status !== false);
    else if (statusFilter === 'inactive') result = result.filter((p) => p.status === false);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          getDisplayName(p).toLowerCase().includes(q) ||
          (p.specialty ?? '').toLowerCase().includes(q) ||
          (p.registration ?? '').toLowerCase().includes(q) ||
          (p.address ?? '').toLowerCase().includes(q),
      );
    }
    if (city) result = result.filter((p) => p.city === city);
    if (category) result = result.filter((p) => p.category === category);
    if (activeTypes.size > 0) {
      result = result.filter((p) => activeTypes.has(p.entityType ?? deriveEntityType(p)));
    }

    return result;
  }, [providers, search, city, category, activeTypes, statusFilter]);

  const hasFilters = !!search || !!city || !!category || activeTypes.size > 0 || statusFilter !== 'active';

  const filterSummaryParts: string[] = [];
  if (statusFilter === 'inactive') filterSummaryParts.push('Inativos');
  else if (statusFilter === 'all') filterSummaryParts.push('Ativos e Inativos');
  if (city) filterSummaryParts.push(`Cidade: ${city}`);
  if (category) filterSummaryParts.push(`Categoria: ${category}`);
  if (activeTypes.size > 0) {
    filterSummaryParts.push(`Tipos: ${Array.from(activeTypes).map((t) => TYPE_BADGE[t].label).join(', ')}`);
  }
  const filterSummary = filterSummaryParts.length > 0 ? filterSummaryParts.join(' · ') : 'Todos os credenciados ativos';

  async function handleExcelExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const qs = new URLSearchParams();
      if (unitId) qs.set('unitId', unitId);
      if (city) qs.set('city', city);
      if (category) qs.set('category', category);
      if (statusFilter !== 'active') qs.set('status', statusFilter);
      const url = `/internal/download/export/rede-credenciada?${qs.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao exportar');
      const blob = await res.blob();
      const cd = res.headers.get('content-disposition') ?? '';
      const match = /filename="?([^";]+)"?/.exec(cd);
      const filename = match?.[1] ?? `rede-credenciada.xlsx`;
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
      setExporting(false);
    }
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { font-size: 10px; }
          tr { page-break-inside: avoid; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #e2e8f0; padding: 4px 6px; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Cabeçalho */}
      <div className="no-print">
        <h1 className="text-2xl font-bold text-slate-800">Rede Credenciada</h1>
        <p className="text-slate-500 text-sm mt-1">
          Diretório completo de credenciados — contatos, endereços e especialidades.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4 no-print">
        {/* Busca */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, especialidade, registro ou endereço…"
            className="w-full pl-9 pr-9 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-slate-50"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdowns: cidade + categoria + status */}
        <div className="flex flex-wrap gap-3">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-white"
          >
            <option value="">Todas as cidades</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-white"
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Toggle status */}
          <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-sm">
            {(['active', 'inactive', 'all'] as StatusFilter[]).map((s) => {
              const labels: Record<StatusFilter, string> = { active: 'Ativos', inactive: 'Inativos', all: 'Todos' };
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 font-medium transition-colors ${
                    statusFilter === s
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {labels[s]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tipo badges */}
        <div className="flex gap-2 flex-wrap">
          {TYPE_ORDER.map((t) => {
            const meta = TYPE_BADGE[t];
            const active = activeTypes.has(t);
            const Icon = meta.Icon;
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  active
                    ? `${meta.cls} ring-2 ring-offset-1 ring-indigo-500/40`
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon size={12} />
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* Contagem + limpar */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 inline-flex items-center gap-1.5">
            <Filter size={13} />
            <strong className="text-slate-800">{filtered.length}</strong>{' '}
            credenciado{filtered.length !== 1 ? 's' : ''}
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCity('');
                setCategory('');
                setActiveTypes(new Set());
                setStatusFilter('active');
              }}
              className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <X size={12} /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Barra de exportação */}
      <div className="flex items-center justify-between no-print">
        <span className="text-xs text-slate-400">
          {filtered.length} credenciado{filtered.length !== 1 ? 's' : ''} exibidos
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
          >
            <Printer size={15} />
            Imprimir / PDF
          </button>
          <button
            type="button"
            onClick={handleExcelExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-60"
          >
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {exporting ? 'Exportando...' : 'Exportar Excel'}
          </button>
        </div>
      </div>

      {/* Cabeçalho apenas para impressão */}
      <div className="print-only mb-2">
        <h1 className="text-lg font-bold">Rede Credenciada — ACIAV Saúde</h1>
        <p className="text-xs text-gray-500 mt-0.5">{filterSummary}</p>
        <p className="text-xs text-gray-500">
          {filtered.length} credenciado{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-slate-500 text-sm">Nenhum credenciado encontrado com esses filtros.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap">Especialidade</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap">Registro</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap">Cidade</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Contato</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Endereço</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const entityType = p.entityType ?? deriveEntityType(p);
                  const meta = TYPE_BADGE[entityType];
                  const Icon = meta.Icon;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Nome */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800">{getDisplayName(p)}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${meta.cls}`}>
                              <Icon size={10} />
                              {meta.label}
                            </span>
                            {p.status === false && (
                              <span className="inline-block bg-red-50 text-red-600 border border-red-100 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                Inativo
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{p.category}</span>
                        </div>
                      </td>
                      {/* Especialidade */}
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {p.specialty || <span className="text-slate-300">—</span>}
                      </td>
                      {/* Registro */}
                      <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                        {p.registration || <span className="text-slate-300">—</span>}
                      </td>
                      {/* Cidade */}
                      <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                        {p.city || <span className="text-slate-300">—</span>}
                      </td>
                      {/* Contato */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {p.phone ? (
                            <div className="flex items-center gap-1 text-xs">
                              <Phone size={11} className="shrink-0 text-slate-400" />
                              <a
                                href={`tel:${p.phone.replace(/\D/g, '')}`}
                                className="text-slate-600 hover:text-indigo-600"
                              >
                                {p.phone}
                              </a>
                            </div>
                          ) : null}
                          {p.whatsapp ? (
                            <div className="flex items-center gap-1 text-xs">
                              <MessageCircle size={11} className="shrink-0 text-emerald-500" />
                              <a
                                href={`https://wa.me/55${p.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                {p.whatsapp}
                              </a>
                            </div>
                          ) : null}
                          {!p.phone && !p.whatsapp && (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </div>
                      </td>
                      {/* Endereço */}
                      <td className="px-4 py-3 text-slate-600 text-xs max-w-xs">
                        {p.address ? (
                          <div className="flex items-start gap-1">
                            <MapPin size={11} className="shrink-0 mt-0.5 text-slate-400" />
                            <span>{p.address}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
