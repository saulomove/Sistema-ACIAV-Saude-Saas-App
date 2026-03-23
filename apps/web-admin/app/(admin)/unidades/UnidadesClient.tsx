'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Building, Plus, Globe, Settings2, Pencil, Loader2 } from 'lucide-react';
import Modal from '../../../components/Modal';
import { api } from '../../../lib/api-client';

interface Unit {
  id: string;
  name: string;
  subdomain: string;
  status: boolean;
  _count?: { users: number; companies: number; providers: number };
}

const EMPTY_FORM = { name: '', subdomain: '' };

export default function UnidadesClient({ units, role }: { units: unknown[]; role: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isSuperAdmin = role === 'super_admin';
  const unitList = units as Unit[];

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }

  function openEdit(u: Unit) {
    setEditingId(u.id);
    setForm({ name: u.name, subdomain: u.subdomain });
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.subdomain.trim()) {
      setError('Nome e subdomínio são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.put(`/units/${editingId}`, { name: form.name, subdomain: form.subdomain });
      } else {
        await api.post('/units', { name: form.name, subdomain: form.subdomain });
      }
      setModalOpen(false);
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(u: Unit) {
    try {
      await api.put(`/units/${u.id}`, { status: !u.status });
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
            <Building className="text-primary" />
            Associações e Unidades
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {unitList.length} unidade(s) no sistema.
            {isPending && <span className="ml-2 text-primary animate-pulse">atualizando...</span>}
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={openCreate}
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={16} /> Nova Unidade
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {unitList.map((unit) => (
          <div
            key={unit.id}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group hover:border-primary/20"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl font-bold text-slate-400">
                  {unit.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 leading-tight">{unit.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <Globe size={12} className="text-slate-400" />
                    {unit.subdomain}.aciavsaude.com.br
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggleStatus(unit)}
                className={`inline-flex px-2 py-1 text-xs font-bold rounded-full cursor-pointer hover:opacity-75 transition-opacity ${unit.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
              >
                {unit.status ? 'Ativo' : 'Inativo'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <p className="text-xs font-medium text-slate-500 mb-1">Vidas</p>
                <p className="font-bold text-slate-800">{(unit._count?.users ?? 0).toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <p className="text-xs font-medium text-slate-500 mb-1">Empresas</p>
                <p className="font-bold text-slate-800">{unit._count?.companies ?? 0}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <p className="text-xs font-medium text-slate-500 mb-1">Credenciados</p>
                <p className="font-bold text-slate-800">{unit._count?.providers ?? 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10 border-t border-gray-100 pt-4">
              <button className="flex-1 bg-white border border-gray-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Settings2 size={16} /> White Label
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => openEdit(unit)}
                  className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  title="Editar"
                >
                  <Pencil size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Unidade' : 'Nova Unidade'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome da Unidade *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
              placeholder="Ex: ACIAV Videira"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Subdomínio *</label>
            <div className="flex items-center">
              <input
                type="text"
                value={form.subdomain}
                onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                className="flex-1 border border-r-0 border-gray-200 rounded-l-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 font-mono"
                placeholder="videira"
              />
              <span className="bg-slate-100 border border-gray-200 text-slate-500 px-3 py-2.5 rounded-r-lg text-sm">.aciavsaude.com.br</span>
            </div>
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
              {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar Unidade'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
