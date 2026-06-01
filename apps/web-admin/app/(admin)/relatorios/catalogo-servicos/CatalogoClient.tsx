'use client';

import { useMemo, useState } from 'react';
import {
  Search, X, Download, Printer, Loader2, Filter,
  Building2, User, Pill, Heart, FlaskConical, Store, Dumbbell, Sparkles,
} from 'lucide-react';

export type EntityType = 'professional' | 'clinic' | 'pharmacy' | 'hospital' | 'lab' | 'store' | 'gym' | 'wellness';

const TYPE_BADGE: Record<EntityType, { label: string; cls: string; Icon: typeof User }> = {
  professional: { label: 'Profissional', cls: 'bg-blue-50 text-blue-700 border border-blue-100',           Icon: User },
  clinic:       { label: 'Clínica',      cls: 'bg-teal-50 text-teal-700 border border-teal-100',           Icon: Building2 },
  pharmacy:     { label: 'Farmácia',     cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100',  Icon: Pill },
  hospital:     { label: 'Hospital',     cls: 'bg-red-50 text-red-700 border border-red-100',              Icon: Heart },
  lab:          { label: 'Laboratório',  cls: 'bg-purple-50 text-purple-700 border border-purple-100',    Icon: FlaskConical },
  store:        { label: 'Loja',         cls: 'bg-amber-50 text-amber-700 border border-amber-100',       Icon: Store },
  gym:          { label: 'Academia',     cls: 'bg-orange-50 text-orange-700 border border-orange-100',    Icon: Dumbbell },
  wellness:     { label: 'Bem-estar',    cls: 'bg-pink-50 text-pink-700 border border-pink-100',          Icon: Sparkles },
};

const TYPE_ORDER: EntityType[] = [
  'professional', 'clinic', 'pharmacy', 'hospital', 'lab', 'store', 'gym', 'wellness',
];

interface Service {
  id: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discountType?: string | null;
  discountValue?: number | null;
  discountMinPercent?: number | null;
  discountMaxPercent?: number | null;
}

interface Provider {
  id: string;
  name: string;
  professionalName?: string | null;
  clinicName?: string | null;
  category: string;
  specialty?: string | null;
  city?: string | null;
  status?: boolean;
  entityType?: EntityType;
  services?: Service[];
  _count: { transactions: number; services: number };
}

interface CatalogRow {
  providerId: string;
  providerName: string;
  category: string;
  specialty: string;
  city: string;
  entityType: EntityType;
  isFirst: boolean;
  service: Service | null;
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDiscount(s: Service): string {
  if (s.discountMinPercent != null || s.discountMaxPercent != null) {
    const min = s.discountMinPercent ?? s.discountMaxPercent!;
    const max = s.discountMaxPercent ?? s.discountMinPercent!;
    return min === max ? `${min}%` : `${min}%–${max}%`;
  }
  if (s.discountType === 'percentage' && Number(s.discountValue ?? 0) > 0) {
    return `${Math.round(Number(s.discountValue))}%`;
  }
  const orig = Number(s.originalPrice);
  const disc = Number(s.discountedPrice);
  if (orig > 0 && disc > 0 && disc < orig) {
    return `${Math.round(((orig - disc) / orig) * 100)}%`;
  }
  return '—';
}

export default function CatalogoClient({ providers, cities, categories, unitId }: Props) {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [activeTypes, setActiveTypes] = useState<Set<EntityType>>(new Set());
  const [exporting, setExporting] = useState(false);

  function toggleType(t: EntityType) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  const filteredProviders = useMemo(() => {
    let result = providers;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          getDisplayName(p).toLowerCase().includes(q) ||
          (p.specialty ?? '').toLowerCase().includes(q) ||
          p.services?.some((s) => s.description.toLowerCase().includes(q)),
      );
    }
    if (city) result = result.filter((p) => p.city === city);
    if (category) result = result.filter((p) => p.category === category);
    if (activeTypes.size > 0) {
      result = result.filter((p) => activeTypes.has(p.entityType ?? deriveEntityType(p)));
    }
    return result;
  }, [providers, search, city, category, activeTypes]);

  const flatRows = useMemo<CatalogRow[]>(() => {
    const rows: CatalogRow[] = [];
    for (const p of filteredProviders) {
      const entityType = p.entityType ?? deriveEntityType(p);
      const services = p.services ?? [];
      if (services.length === 0) {
        rows.push({
          providerId: p.id,
          providerName: getDisplayName(p),
          category: p.category,
          specialty: p.specialty ?? '',
          city: p.city ?? '',
          entityType,
          isFirst: true,
          service: null,
        });
      } else {
        services.forEach((s, i) => {
          rows.push({
            providerId: p.id,
            providerName: getDisplayName(p),
            category: p.category,
            specialty: p.specialty ?? '',
            city: p.city ?? '',
            entityType,
            isFirst: i === 0,
            service: s,
          });
        });
      }
    }
    return rows;
  }, [filteredProviders]);

  const totalServices = flatRows.filter((r) => r.service !== null).length;
  const totalWithoutServices = filteredProviders.filter((p) => !p.services?.length).length;
  const hasFilters = !!search || !!city || !!category || activeTypes.size > 0;

  const filterSummaryParts: string[] = [];
  if (city) filterSummaryParts.push(`Cidade: ${city}`);
  if (category) filterSummaryParts.push(`Categoria: ${category}`);
  if (activeTypes.size > 0)
    filterSummaryParts.push(`Tipos: ${Array.from(activeTypes).map((t) => TYPE_BADGE[t].label).join(', ')}`);
  const filterSummary = filterSummaryParts.length > 0 ? filterSummaryParts.join(' · ') : 'Todos os credenciados';

  async function handleExcelExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const qs = new URLSearchParams();
      if (unitId) qs.set('unitId', unitId);
      if (city) qs.set('city', city);
      if (category) qs.set('category', category);
      const url = `/internal/download/export/providers-services?${qs.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao exportar');
      const blob = await res.blob();
      const cd = res.headers.get('content-disposition') ?? '';
      const match = /filename="?([^";]+)"?/.exec(cd);
      const filename = match?.[1] ?? `catalogo-servicos.xlsx`;
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
          body { font-size: 11px; }
          tr { page-break-inside: avoid; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Cabeçalho */}
      <div className="no-print">
        <h1 className="text-2xl font-bold text-slate-800">Catálogo de Serviços</h1>
        <p className="text-slate-500 text-sm mt-1">
          Profissionais, especialidades e tabela de preços da rede credenciada.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4 no-print">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, especialidade ou serviço…"
            className="w-full pl-9 pr-9 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-slate-50"
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

        <div className="flex flex-wrap gap-3">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-white"
          >
            <option value="">Todas as cidades</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-white"
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

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
                    ? `${meta.cls} ring-2 ring-offset-1 ring-teal-500/40`
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon size={12} />
                {meta.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 inline-flex items-center gap-1.5 flex-wrap">
            <Filter size={13} />
            <strong className="text-slate-800">{filteredProviders.length}</strong>{' '}
            credenciado{filteredProviders.length !== 1 ? 's' : ''}
            {' · '}
            <strong className="text-slate-800">{totalServices}</strong>{' '}
            serviço{totalServices !== 1 ? 's' : ''}
            {totalWithoutServices > 0 && (
              <span className="text-amber-600 font-medium">
                · {totalWithoutServices} sem serviço cadastrado
              </span>
            )}
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setSearch(''); setCity(''); setCategory(''); setActiveTypes(new Set()); }}
              className="text-xs font-bold text-teal-600 hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <X size={12} /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Barra de exportação */}
      <div className="flex items-center justify-between no-print">
        <span className="text-xs text-slate-400">
          {flatRows.length} linha{flatRows.length !== 1 ? 's' : ''} na tabela
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
        <h1 className="text-lg font-bold">Catálogo de Serviços — ACIAV Saúde</h1>
        <p className="text-xs text-gray-500 mt-0.5">{filterSummary}</p>
        <p className="text-xs text-gray-500">
          {filteredProviders.length} credenciados · {totalServices} serviços
        </p>
      </div>

      {/* Tabela */}
      {flatRows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-slate-500 text-sm">Nenhum credenciado encontrado com esses filtros.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap">Especialidade</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Serviço</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap">Preço Original</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap">Preço ACIAV</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Desconto</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Cidade</th>
                </tr>
              </thead>
              <tbody>
                {flatRows.map((row, i) => {
                  const meta = TYPE_BADGE[row.entityType];
                  const Icon = meta.Icon;
                  const orig = row.service ? Number(row.service.originalPrice) : 0;
                  const disc = row.service ? Number(row.service.discountedPrice) : 0;
                  return (
                    <tr
                      key={`${row.providerId}-${row.service?.id ?? 'empty'}-${i}`}
                      className={`border-b border-gray-50 hover:bg-slate-50/50 transition-colors ${
                        row.isFirst && i > 0 ? 'border-t border-t-slate-100' : ''
                      }`}
                    >
                      {/* Nome */}
                      <td className="px-4 py-3 align-top">
                        {row.isFirst ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-800">{row.providerName}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${meta.cls}`}>
                                <Icon size={10} />
                                {meta.label}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">{row.category}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 italic">{row.providerName}</span>
                        )}
                      </td>
                      {/* Especialidade */}
                      <td className="px-4 py-3 align-top text-slate-600">
                        {row.isFirst
                          ? row.specialty || <span className="text-slate-300">—</span>
                          : null}
                      </td>
                      {/* Serviço */}
                      <td className="px-4 py-3 align-top">
                        {row.service ? (
                          <span className="text-slate-700">{row.service.description}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                            Sem serviços cadastrados
                          </span>
                        )}
                      </td>
                      {/* Preço Original */}
                      <td className="px-4 py-3 text-right text-slate-500 align-top whitespace-nowrap">
                        {row.service && orig > 0
                          ? formatCurrency(orig)
                          : <span className="text-slate-300">—</span>}
                      </td>
                      {/* Preço ACIAV */}
                      <td className="px-4 py-3 text-right font-semibold text-teal-700 align-top whitespace-nowrap">
                        {row.service && disc > 0
                          ? formatCurrency(disc)
                          : <span className="text-slate-300 font-normal">—</span>}
                      </td>
                      {/* Desconto */}
                      <td className="px-4 py-3 text-center align-top">
                        {row.service && formatDiscount(row.service) !== '—' ? (
                          <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold px-2 py-0.5 rounded-full">
                            {formatDiscount(row.service)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      {/* Cidade */}
                      <td className="px-4 py-3 text-slate-500 text-xs align-top">
                        {row.isFirst
                          ? row.city || <span className="text-slate-300">—</span>
                          : null}
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
