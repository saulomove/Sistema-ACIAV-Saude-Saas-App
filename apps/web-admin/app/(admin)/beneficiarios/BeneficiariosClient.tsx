'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Search, Pencil, Trash2, CreditCard, ActivitySquare, Loader2 } from 'lucide-react';
import Modal from '../../../components/Modal';
import { api } from '../../../lib/api-client';

interface Company { id: string; corporateName: string; }
interface User {
  id: string;
  fullName: string;
  cpf: string;
  type: string;
  status: boolean;
  parentId?: string | null;
  company?: { corporateName: string } | null;
}

const EMPTY_FORM = { fullName: '', cpf: '', type: 'titular', companyId: '', parentId: '' };

export default function BeneficiariosClient({
  users,
  companies,
  unitId,
}: {
  users: unknown[];
  companies: unknown[];
  unitId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('ativo');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const companyList = companies as Company[];
  const userList = users as User[];
  const titulares = userList.filter((u) => u.type === 'titular' && u.status);

  const lista = userList.filter((u) => {
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

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }

  function openEdit(u: User) {
    setEditingId(u.id);
    setForm({
      fullName: u.fullName,
      cpf: u.cpf,
      type: u.type,
      companyId: '',
      parentId: u.parentId ?? '',
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.fullName.trim() || !form.cpf.trim()) {
      setError('Nome e CPF são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, { fullName: form.fullName });
      } else {
        await api.post('/users', {
          unitId,
          fullName: form.fullName,
          cpf: form.cpf.replace(/\D/g, ''),
          type: form.type,
          companyId: form.companyId || undefined,
          parentId: form.parentId || undefined,
        });
      }
      setModalOpen(false);
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(u: User) {
    try {
      await api.patch(`/users/${u.id}/status`, { status: !u.status });
      startTransition(() => router.refresh());
    } catch {
      alert('Erro ao alterar status.');
    }
  }

  async function handleDelete(u: User) {
    if (!confirm(`Inativar "${u.fullName}"? O histórico será preservado.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      startTransition(() => router.refresh());
    } catch {
      alert('Erro ao inativar beneficiário.');
    }
  }

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
            {userList.length} beneficiários cadastrados — {lista.length} exibidos
            {isPending && <span className="ml-2 text-primary animate-pulse">atualizando...</span>}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> Novo Beneficiário
        </button>
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
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-white border border-gray-200 text-sm rounded-lg px-4 py-2 text-slate-700 outline-none">
          <option value="todos">Todos os Vínculos</option>
          <option value="titular">Apenas Titulares</option>
          <option value="dependente">Apenas Dependentes</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-gray-200 text-sm rounded-lg px-4 py-2 text-slate-700 outline-none">
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
                  <th className="px-6 py-4 text-right">Ações</th>
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
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md border ${u.type === 'titular' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {typeLabel(u.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`inline-flex px-2 py-1 text-xs font-bold rounded-full cursor-pointer transition-opacity hover:opacity-75 ${u.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {u.status ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button title="Ver Histórico" className="text-slate-400 hover:text-secondary transition-colors p-2 rounded-lg hover:bg-slate-50">
                          <ActivitySquare size={17} />
                        </button>
                        <button title="Carteirinha" className="text-slate-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-slate-50">
                          <CreditCard size={17} />
                        </button>
                        <button title="Editar" onClick={() => openEdit(u)} className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50">
                          <Pencil size={17} />
                        </button>
                        <button title="Inativar" onClick={() => handleDelete(u)} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Beneficiário' : 'Novo Beneficiário'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome Completo *</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50"
              placeholder="Nome completo do beneficiário"
            />
          </div>

          {!editingId && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">CPF *</label>
              <input
                type="text"
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50 font-mono"
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
          )}

          {!editingId && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Tipo de Vínculo *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value, parentId: '' })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
              >
                <option value="titular">Titular</option>
                <option value="dependente">Dependente</option>
              </select>
            </div>
          )}

          {!editingId && form.type === 'dependente' && titulares.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Titular Responsável</label>
              <select
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
              >
                <option value="">Selecionar titular...</option>
                {titulares.map((t) => (
                  <option key={t.id} value={t.id}>{t.fullName}</option>
                ))}
              </select>
            </div>
          )}

          {!editingId && companyList.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Empresa</label>
              <select
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
              >
                <option value="">Sem empresa vinculada</option>
                {companyList.map((c) => (
                  <option key={c.id} value={c.id}>{c.corporateName}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 border border-gray-200 text-slate-700 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
