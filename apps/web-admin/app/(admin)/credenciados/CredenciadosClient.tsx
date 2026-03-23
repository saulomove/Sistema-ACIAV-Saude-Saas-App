'use client';

import { useState } from 'react';
import { Stethoscope, Plus, Search, MoreVertical, Star } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  category: string;
  rankingScore: number;
  status?: boolean;
  _count?: { transactions: number };
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Odontologia: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  Farmácia: { bg: 'bg-orange-50', text: 'text-orange-600' },
  Médico: { bg: 'bg-blue-50', text: 'text-blue-600' },
  Terapias: { bg: 'bg-purple-50', text: 'text-purple-600' },
  Laboratório: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
  Fisioterapia: { bg: 'bg-rose-50', text: 'text-rose-600' },
};

function categoryStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? { bg: 'bg-slate-50', text: 'text-slate-600' };
}

export default function CredenciadosClient({ providers }: { providers: unknown[] }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');

  const categories = Array.from(new Set((providers as Provider[]).map((p) => p.category).filter(Boolean)));

  const lista = (providers as Provider[]).filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'todos' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope className="text-primary" />
            Gestão de Credenciados
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {providers.length} credenciados — {lista.length} exibidos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            Tabela de Preços Global
          </button>
          <button className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
            <Plus size={16} /> Novo Credenciado
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-3 bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar clínica ou médico..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-gray-200 text-sm rounded-lg px-4 py-2 text-slate-700 outline-none"
          >
            <option value="todos">Todas as Categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {lista.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Stethoscope size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum credenciado encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Credenciado</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Ranking (IA)</th>
                  <th className="px-6 py-4">Atendimentos</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lista.map((p) => {
                  const style = categoryStyle(p.category);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 ${style.bg} ${style.text} rounded-md text-xs font-semibold`}>
                          {p.category || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-amber-500 font-medium">
                          <Star size={16} fill="currentColor" strokeWidth={0} />
                          {(p.rankingScore ?? 0).toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{p._count?.transactions ?? 0}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:text-primary-dark font-medium mr-4">Catálogo</button>
                        <button className="text-slate-400 hover:text-primary p-1">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
