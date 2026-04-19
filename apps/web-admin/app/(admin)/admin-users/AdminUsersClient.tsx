'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Plus, Search, Pencil, Loader2, Eye, EyeOff } from 'lucide-react';
import Modal from '../../../components/Modal';
import { api } from '../../../lib/api-client';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  unitId?: string | null;
  companyId?: string | null;
  providerId?: string | null;
  status: boolean;
  createdAt: string;
}

interface Unit { id: string; name: string; }

const ROLE_OPTIONS = [
  { value: 'admin_unit', label: 'Admin Unidade', desc: 'Gerencia uma unidade completa' },
  { value: 'super_admin', label: 'Super Admin', desc: 'Acesso global ao SaaS' },
];

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-secondary/10 text-secondary',
  admin_unit: 'bg-primary/10 text-primary',
  rh: 'bg-blue-100 text-blue-700',
  provider: 'bg-emerald-100 text-emerald-700',
};

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin_unit: 'Admin Unidade',
  rh: 'RH',
  provider: 'Credenciado',
};

const EMPTY_FORM = { email: '', password: '', role: 'admin_unit', unitId: '' };

export default function AdminUsersClient({ adminUsers, units }: { adminUsers: unknown[]; units: unknown[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const userList = adminUsers as AdminUser[];
  const unitList = units as Unit[];

  const lista = userList.filter((u) => {
    const matchSearch = !search || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'todos' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  function getUnitName(unitId?: string | null) {
    if (!unitId) return '—';
    return unitList.find((u) => u.id === unitId)?.name ?? unitId;
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
    setShowPass(false);
    setModalOpen(true);
  }

  function openEdit(u: AdminUser) {
    setForm({ email: u.email, password: '', role: u.role, unitId: u.unitId ?? '' });
    setEditingId(u.id);
    setError('');
    setShowPass(false);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.email.trim()) {
      setError('E-mail é obrigatório.');
      return;
    }
    if (!editingId && !form.password.trim()) {
      setError('Senha é obrigatória para novos usuários.');
      return;
    }
    if (form.password && form.password.length < 8) {
      setError('Senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (form.role === 'admin_unit' && !form.unitId) {
      setError('Selecione a unidade para o Admin Unidade.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.patch(`/auth/admin-users/${editingId}`, {
          email: form.email,
          role: form.role,
          unitId: form.role === 'super_admin' ? null : (form.unitId || null),
        });
      } else {
        await api.post('/auth/admin-users', {
          email: form.email,
          password: form.password,
          role: form.role,
          unitId: form.unitId || undefined,
        });
      }
      setModalOpen(false);
      setEditingId(null);
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(u: AdminUser) {
    try {
      await api.patch(`/auth/admin-users/${u.id}/status`, { status: !u.status });
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
            <ShieldCheck className="text-secondary" />
            Usuários Administradores
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie Super Admins e Admins de Unidade do sistema.
            {isPending && <span className="ml-2 text-primary animate-pulse">atualizando...</span>}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-secondary hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> Novo Admin
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por e-mail..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white border border-gray-200 text-sm rounded-lg px-4 py-2 text-slate-700 outline-none"
        >
          <option value="todos">Todos os Perfis</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin_unit">Admin Unidade</option>
          <option value="rh">RH</option>
          <option value="provider">Credenciado</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {lista.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">E-mail</th>
                  <th className="px-6 py-4">Perfil</th>
                  <th className="px-6 py-4">Unidade</th>
                  <th className="px-6 py-4">Criado em</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lista.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ${ROLE_BADGE[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{getUnitName(u.unitId)}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`inline-flex px-2 py-1 text-xs font-bold rounded-full cursor-pointer hover:opacity-75 transition-opacity ${u.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {u.status ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEdit(u)}
                        className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Administrador' : 'Novo Usuário Administrador'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">E-mail *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
              placeholder="admin@exemplo.com.br"
            />
          </div>

          {!editingId && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Senha *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-11 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                  placeholder="Mínimo 8 caracteres"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
          )}

          {editingId && (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-lg">
              Para alterar a senha, use o botão &quot;Resetar senha&quot; na listagem.
            </p>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Perfil *</label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.role === opt.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/40'}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={form.role === opt.value}
                    onChange={(e) => setForm({ ...form, role: e.target.value, unitId: '' })}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {form.role === 'admin_unit' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Unidade *</label>
              <select
                value={form.unitId}
                onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
              >
                <option value="">Selecionar unidade...</option>
                {unitList.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}

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
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar Usuário'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
