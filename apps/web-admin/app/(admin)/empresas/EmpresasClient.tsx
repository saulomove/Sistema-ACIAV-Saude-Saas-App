'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Building, Plus, Search, Pencil, Trash2, FileSpreadsheet, Download, Users, Loader2 } from 'lucide-react';
import Modal from '../../../components/Modal';
import { api } from '../../../lib/api-client';

interface Company {
  id: string;
  corporateName: string;
  cnpj?: string;
  adminEmail?: string;
  status: boolean;
  _count?: { users: number };
}

interface CompanyStats {
  total: number;
  active: number;
  totalUsers: number;
}

const EMPTY_FORM = { corporateName: '', cnpj: '', adminEmail: '' };

export default function EmpresasClient({
  companies,
  stats,
  unitId,
}: {
  companies: unknown[];
  stats: CompanyStats;
  unitId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const lista = (companies as Company[]).filter(
    (c) => !search || c.corporateName.toLowerCase().includes(search.toLowerCase()) || (c.cnpj ?? '').includes(search)
  );

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setTempPassword(null);
    setModalOpen(true);
  }

  function openEdit(c: Company) {
    setEditingId(c.id);
    setForm({ corporateName: c.corporateName, cnpj: c.cnpj ?? '', adminEmail: c.adminEmail ?? '' });
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.corporateName.trim() || !form.cnpj.trim()) {
      setError('Razão social e CNPJ são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.put(`/companies/${editingId}`, {
          corporateName: form.corporateName,
          adminEmail: form.adminEmail || undefined,
        });
        setModalOpen(false);
      } else {
        const result = await api.post('/companies', {
          unitId,
          corporateName: form.corporateName,
          cnpj: form.cnpj.replace(/\D/g, ''),
          adminEmail: form.adminEmail || 'rh@empresa.com.br',
        });
        const r = result as { tempPassword?: string } | null;
        if (r?.tempPassword) {
          setTempPassword(r.tempPassword);
        } else {
          setModalOpen(false);
        }
      }
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(c: Company) {
    try {
      await api.patch(`/companies/${c.id}/status`, { status: !c.status });
      startTransition(() => router.refresh());
    } catch {
      alert('Erro ao alterar status.');
    }
  }

  async function handleDelete(c: Company) {
    if (!confirm(`Inativar "${c.corporateName}"? Os beneficiários vinculados serão preservados.`)) return;
    try {
      await api.delete(`/companies/${c.id}`);
      startTransition(() => router.refresh());
    } catch {
      alert('Erro ao inativar empresa.');
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building className="text-secondary" />
            Gestão de Empresas (RH)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie os polos, RHs conveniados e importe listas de vidas.
            {isPending && <span className="ml-2 text-primary animate-pulse">atualizando...</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
            <FileSpreadsheet size={16} /> Importar Planilha
          </button>
          <button
            onClick={openCreate}
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={16} /> Nova Empresa
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Empresas Cadastradas</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total.toLocaleString('pt-BR')}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Building size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Empresas Ativas</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.active.toLocaleString('pt-BR')}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <Building size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Vidas Totais</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalUsers.toLocaleString('pt-BR')}</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou CNPJ..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm font-medium">
            <Download size={16} /> Exportar
          </button>
        </div>

        {lista.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Building size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma empresa encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Razão Social</th>
                  <th className="px-6 py-4">CNPJ</th>
                  <th className="px-6 py-4">Beneficiários</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lista.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{emp.corporateName}</td>
                    <td className="px-6 py-4 font-mono text-xs">{emp.cnpj ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md text-slate-700 font-semibold text-xs border border-slate-200">
                        {emp._count?.users ?? 0} beneficiários
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        className={`inline-flex px-2 py-1 text-xs font-bold rounded-full cursor-pointer hover:opacity-75 transition-opacity ${emp.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {emp.status ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(emp)} className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors" title="Editar">
                          <Pencil size={17} />
                        </button>
                        <button onClick={() => handleDelete(emp)} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Inativar">
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
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setTempPassword(null); }} title={editingId ? 'Editar Empresa' : 'Nova Empresa'}>
        <div className="space-y-4">

          {tempPassword && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-bold text-emerald-800">Empresa criada com sucesso!</p>
              <p className="text-xs text-emerald-700">Acesso do RH criado automaticamente. Compartilhe as credenciais abaixo:</p>
              <div className="bg-white border border-emerald-200 rounded-lg px-3 py-2 space-y-1">
                <p className="text-xs text-slate-500">E-mail: <span className="font-bold text-slate-800">{form.adminEmail || 'rh@empresa.com.br'}</span></p>
                <p className="text-xs text-slate-500">Senha temporária: <span className="font-bold font-mono text-slate-800">{tempPassword}</span></p>
              </div>
              <p className="text-xs text-amber-700 font-medium">Anote a senha — ela não será exibida novamente.</p>
              <button
                onClick={() => { setModalOpen(false); setTempPassword(null); }}
                className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors mt-2"
              >
                Entendido, fechar
              </button>
            </div>
          )}

          {!tempPassword && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Razão Social *</label>
                <input
                  type="text"
                  value={form.corporateName}
                  onChange={(e) => setForm({ ...form, corporateName: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                  placeholder="Razão Social da Empresa LTDA"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">CNPJ *</label>
                  <input
                    type="text"
                    value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 font-mono"
                    placeholder="00.000.000/0001-00"
                    maxLength={18}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">E-mail do RH / Responsável</label>
                <input
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                  placeholder="rh@empresa.com.br"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setModalOpen(false); setTempPassword(null); }} className="flex-1 border border-gray-200 text-slate-700 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors">
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
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
