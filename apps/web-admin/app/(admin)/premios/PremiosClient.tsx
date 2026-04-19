'use client';

import { useState } from 'react';
import { Gift, Plus, QrCode, Search, Award, Pencil, Trash2, X } from 'lucide-react';
import ConfirmDeleteDialog from '../../../components/ConfirmDeleteDialog';

interface Reward {
  id: string;
  name: string;
  pointsRequired: number;
  stock: number;
  provider: { id: string; name: string };
}

interface Provider {
  id: string;
  name: string;
}

interface PremiosClientProps {
  initialRewards: Reward[];
  providers: Provider[];
}

export default function PremiosClient({ initialRewards, providers }: PremiosClientProps) {
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [form, setForm] = useState({ providerId: '', name: '', pointsRequired: '', stock: '' });
  const [saving, setSaving] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Reward | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const filtered = rewards.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.provider.name.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setEditing(null);
    setForm({ providerId: providers[0]?.id ?? '', name: '', pointsRequired: '', stock: '' });
    setModalOpen(true);
  }

  function openEdit(r: Reward) {
    setEditing(r);
    setForm({ providerId: r.provider.id, name: r.name, pointsRequired: String(r.pointsRequired), stock: String(r.stock) });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        providerId: form.providerId,
        name: form.name,
        pointsRequired: Number(form.pointsRequired),
        stock: Number(form.stock),
      };
      const url = editing ? `/internal/api/rewards/${editing.id}` : '/internal/api/rewards';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      const updated: Reward = await res.json();
      if (editing) {
        setRewards((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        setRewards((prev) => [updated, ...prev]);
      }
      setModalOpen(false);
    } catch {
      alert('Erro ao salvar prêmio.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/internal/api/rewards/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setRewards((prev) => prev.filter((r) => r.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        alert('Erro ao excluir prêmio.');
      }
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Gift className="text-primary" />
            Central de Gamificação
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie catálogo de brindes e valide os cupons de resgate dos usuários.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> Novo Brinde
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Validação de Voucher */}
        <div className="lg:col-span-1 bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <QrCode size={150} />
          </div>
          <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
            <Award />
            Validar Voucher
          </h3>
          <p className="text-primary-100 text-sm mb-6">Digite o código de 6 dígitos gerado pelo aplicativo do paciente para debitar os pontos do resgate.</p>
          <div className="space-y-4 relative z-10">
            <div>
              <label className="text-xs font-bold text-primary-200 uppercase tracking-wider mb-1 block">Código do Cupom</label>
              <input
                type="text"
                maxLength={6}
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Ex: A7X9P2"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-2xl tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <button className="w-full bg-secondary hover:bg-secondary-dark text-white font-bold py-3 rounded-xl transition-colors shadow-md">
              Processar Resgate
            </button>
          </div>
        </div>

        {/* Catálogo de Prêmios */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-lg">Catálogo Ativo ({rewards.length})</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar brinde..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 py-10 text-sm">Nenhum prêmio cadastrado.</p>
          ) : (
            <div className="space-y-4">
              {filtered.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-2xl">
                      🎁
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{item.name}</h4>
                      <p className="text-xs text-slate-500">Oferecido por: {item.provider.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-500 mb-0.5">Custo</p>
                      <p className="font-bold text-primary">{item.pointsRequired} pts</p>
                    </div>
                    <div className="text-right w-16">
                      <p className="text-xs font-medium text-slate-500 mb-0.5">Estoque</p>
                      <p className="font-bold text-slate-800">{item.stock}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)} className="text-slate-400 hover:text-primary transition-colors"><Pencil size={16} /></button>
                      <button onClick={() => setDeleteTarget(item)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-slate-800 text-lg">{editing ? 'Editar Prêmio' : 'Novo Prêmio'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {!editing && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Credenciado</label>
                  <select
                    value={form.providerId}
                    onChange={(e) => setForm({ ...form, providerId: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nome do Prêmio</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: Limpeza de Pele"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Pontos Necessários</label>
                  <input
                    type="number"
                    min={1}
                    value={form.pointsRequired}
                    onChange={(e) => setForm({ ...form, pointsRequired: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Estoque</label>
                  <input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="flex-1 border border-gray-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.pointsRequired}
                className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Excluir prêmio"
        description="O prêmio será removido permanentemente do catálogo. Digite CONFIRMAR para prosseguir."
        targetLabel={deleteTarget?.name}
        confirmButtonLabel="Excluir"
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => !deleteBusy && setDeleteTarget(null)}
      />
    </div>
  );
}
