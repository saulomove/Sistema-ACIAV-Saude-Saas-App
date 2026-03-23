'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Stethoscope, Plus, Search, Pencil, Trash2, Star, Loader2 } from 'lucide-react';
import Modal from '../../../components/Modal';
import { api } from '../../../lib/api-client';

interface Provider {
  id: string;
  name: string;
  category: string;
  rankingScore: number;
  bio?: string | null;
  address?: string | null;
  status?: boolean;
  _count?: { transactions: number };
}

const CATEGORIES = ['Odontologia', 'Médico', 'Farmácia', 'Laboratório', 'Fisioterapia', 'Terapias', 'Nutrição', 'Psicologia', 'Oftalmologia', 'Outro'];

const CATEGORY_STYLE: Record<string, string> = {
  Odontologia: 'bg-emerald-50 text-emerald-700',
  Médico: 'bg-blue-50 text-blue-700',
  Farmácia: 'bg-orange-50 text-orange-700',
  Laboratório: 'bg-cyan-50 text-cyan-700',
  Fisioterapia: 'bg-rose-50 text-rose-700',
  Terapias: 'bg-purple-50 text-purple-700',
  Nutrição: 'bg-lime-50 text-lime-700',
  Psicologia: 'bg-indigo-50 text-indigo-700',
  Oftalmologia: 'bg-sky-50 text-sky-700',
};

const EMPTY_FORM = { name: '', category: 'Médico', bio: '', address: '' };

export default function CredenciadosClient({
  providers,
  unitId,
}: {
  providers: unknown[];
  unitId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const providerList = providers as Provider[];
  const categories = Array.from(new Set(providerList.map((p) => p.category).filter(Boolean)));

  const lista = providerList.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'todos' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }

  function openEdit(p: Provider) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      bio: p.bio ?? '',
      address: p.address ?? '',
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.put(`/providers/${editingId}`, {
          name: form.name,
          category: form.category,
          bio: form.bio || undefined,
          address: form.address || undefined,
        });
      } else {
        await api.post('/providers', {
          unitId,
          name: form.name,
          category: form.category,
          bio: form.bio || undefined,
          address: form.address || undefined,
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

  async function handleToggleStatus(p: Provider) {
    try {
      await api.patch(`/providers/${p.id}/status`, { status: !(p.status ?? true) });
      startTransition(() => router.refresh());
    } catch {
      alert('Erro ao alterar status.');
    }
  }

  async function handleDelete(p: Provider) {
    if (!confirm(`Inativar "${p.name}"?`)) return;
    try {
      await api.delete(`/providers/${p.id}`);
      startTransition(() => router.refresh());
    } catch {
      alert('Erro ao inativar credenciado.');
    }
  }

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
            {providerList.length} credenciados — {lista.length} exibidos
            {isPending && <span className="ml-2 text-primary animate-pulse">atualizando...</span>}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> Novo Credenciado
        </button>
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
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
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
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Atend.</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lista.map((p) => {
                  const style = CATEGORY_STYLE[p.category] ?? 'bg-slate-50 text-slate-600';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800">{p.name}</span>
                        {p.bio && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{p.bio}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${style}`}>
                          {p.category || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-amber-500 font-medium">
                          <Star size={15} fill="currentColor" strokeWidth={0} />
                          {(p.rankingScore ?? 0).toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{p._count?.transactions ?? 0}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`inline-flex px-2 py-1 text-xs font-bold rounded-full cursor-pointer hover:opacity-75 transition-opacity ${(p.status ?? true) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                        >
                          {(p.status ?? true) ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors" title="Editar">
                            <Pencil size={17} />
                          </button>
                          <button onClick={() => handleDelete(p)} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Inativar">
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Credenciado' : 'Novo Credenciado'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
              placeholder="Nome da clínica, médico ou estabelecimento"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Categoria *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Endereço</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Descrição / Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 resize-none"
              placeholder="Especialidades, diferenciais, informações relevantes..."
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
