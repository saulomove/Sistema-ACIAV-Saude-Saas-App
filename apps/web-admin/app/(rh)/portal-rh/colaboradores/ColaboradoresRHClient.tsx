'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Search, Loader2 } from 'lucide-react';
import Modal from '../../../../components/Modal';
import { api } from '../../../../lib/api-client';

interface Colaborador {
  id: string;
  fullName: string;
  cpf: string;
  status: boolean;
  createdAt: string;
  _count?: { dependents: number; transactions: number };
}

const EMPTY_FORM = { fullName: '', cpf: '' };

export default function ColaboradoresRHClient({
  colaboradores,
  companyId,
  unitId,
}: {
  colaboradores: unknown[];
  companyId: string;
  unitId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const lista = (colaboradores as Colaborador[]).filter((c) =>
    !search ||
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf.includes(search),
  );

  function openCreate() {
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }

  function formatCPF(value: string) {
    return value
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  async function handleSave() {
    const cpfClean = form.cpf.replace(/\D/g, '');
    if (!form.fullName.trim()) { setError('Nome completo é obrigatório.'); return; }
    if (cpfClean.length !== 11) { setError('CPF inválido.'); return; }
    if (!companyId || !unitId) { setError('Empresa ou unidade não configurada.'); return; }

    setSaving(true);
    setError('');
    try {
      await api.post('/users', {
        fullName: form.fullName.trim(),
        cpf: cpfClean,
        type: 'titular',
        companyId,
        unitId,
      });
      setModalOpen(false);
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao cadastrar colaborador.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(c: Colaborador) {
    try {
      await api.patch(`/users/${c.id}/status`, { status: !c.status });
      startTransition(() => router.refresh());
    } catch {
      alert('Erro ao alterar status.');
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-secondary" /> Colaboradores
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Titulares do plano de saúde da sua empresa.
            {isPending && <span className="ml-2 text-primary animate-pulse">atualizando...</span>}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-secondary hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> Novo Colaborador
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou CPF..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {lista.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum colaborador encontrado</p>
            <button onClick={openCreate} className="mt-3 text-secondary text-sm font-medium hover:underline">
              Cadastrar primeiro colaborador
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">CPF</th>
                  <th className="px-6 py-4">Dependentes</th>
                  <th className="px-6 py-4">Atendimentos</th>
                  <th className="px-6 py-4">Cadastrado em</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lista.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{c.fullName}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                      {c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">{c._count?.dependents ?? 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">{c._count?.transactions ?? 0}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(c)}
                        className={`inline-flex px-2 py-1 text-xs font-bold rounded-full cursor-pointer hover:opacity-75 transition-opacity ${c.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {c.status ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Colaborador">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome Completo *</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
              placeholder="Nome completo do colaborador"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">CPF *</label>
            <input
              type="text"
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: formatCPF(e.target.value) })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 font-mono"
              placeholder="000.000.000-00"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 border border-gray-200 text-slate-700 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-secondary text-white py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Salvando...' : 'Cadastrar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
