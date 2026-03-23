'use client';

import { useState } from 'react';
import { Users, Plus, Search, MoreVertical, CreditCard, ActivitySquare } from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  cpf: string;
  type: string;
  status: boolean;
  company?: { corporateName: string } | null;
}

export default function BeneficiariosClient({ users }: { users: unknown[] }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('ativo');

  const lista = (users as User[]).filter((u) => {
    const matchSearch =
      !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.cpf.includes(search) ||
      (u.company?.corporateName ?? '').toLowerCase().includes(search.toLowerCase());

    const matchType =
      typeFilter === 'todos' ||
      (typeFilter === 'titular' && u.type === 'titular') ||
      (typeFilter === 'dependente' && u.type === 'dependente');

    const matchStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'ativo' && u.status) ||
      (statusFilter === 'inativo' && !u.status);

    return matchSearch && matchType && matchStatus;
  });

  const typeLabel = (type: string) => (type === 'titular' ? 'Titular' : 'Dependente');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-primary" />
            Gestão de Beneficiários
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {users.length} beneficiários cadastrados — {lista.length} exibidos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
            <Plus size={16} /> Novo Beneficiário
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por Nome, CPF ou Empresa..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white border border-gray-200 text-sm rounded-lg px-4 py-2 text-slate-700 outline-none"
        >
          <option value="todos">Todos os Vínculos</option>
          <option value="titular">Apenas Titulares</option>
          <option value="dependente">Apenas Dependentes</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-200 text-sm rounded-lg px-4 py-2 text-slate-700 outline-none"
        >
          <option value="ativo">Status: Ativo</option>
          <option value="inativo">Status: Inativo</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {lista.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum beneficiário encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Nome Completo</th>
                  <th className="px-6 py-4">CPF</th>
                  <th className="px-6 py-4">Vínculo</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Extrato / Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lista.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{u.fullName}</span>
                        <span className="text-xs text-slate-500 mt-0.5">{u.company?.corporateName ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{u.cpf}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md border ${
                          u.type === 'titular'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {typeLabel(u.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                          u.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {u.status ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                      <button title="Ver Histórico de Uso" className="text-slate-400 hover:text-secondary transition-colors p-1">
                        <ActivitySquare size={18} />
                      </button>
                      <button title="Emitir 2ª Via da Carteirinha" className="text-slate-400 hover:text-primary transition-colors p-1">
                        <CreditCard size={18} />
                      </button>
                      <button className="text-slate-400 hover:text-slate-800 p-1">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
