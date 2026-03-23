'use client';

import { useState } from 'react';
import { Wrench, Plus, Pencil, Trash2, X, Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../../../lib/api-client';

interface Service {
  id: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
}

function fmtMoney(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function discount(orig: number, disc: number) {
  if (!orig || orig === 0) return 0;
  return Math.round(((orig - disc) / orig) * 100);
}

export default function ServicosClient({
  providerId,
  initialServices,
}: {
  providerId: string;
  initialServices: Service[];
}) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState('');
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'ok' | 'err'>('ok');

  const [form, setForm] = useState({ description: '', originalPrice: '', discountedPrice: '' });
  const [formError, setFormError] = useState('');

  function openCreate() {
    setEditing(null);
    setForm({ description: '', originalPrice: '', discountedPrice: '' });
    setFormError('');
    setShowModal(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    setForm({
      description: s.description,
      originalPrice: String(s.originalPrice),
      discountedPrice: String(s.discountedPrice),
    });
    setFormError('');
    setShowModal(true);
  }

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3500);
  }

  async function handleSave() {
    if (!form.description.trim()) { setFormError('Informe a descrição do serviço.'); return; }
    const orig = parseFloat(form.originalPrice.replace(',', '.'));
    const disc = parseFloat(form.discountedPrice.replace(',', '.'));
    if (isNaN(orig) || orig <= 0) { setFormError('Informe um valor particular válido.'); return; }
    if (isNaN(disc) || disc < 0) { setFormError('Informe um valor com desconto válido.'); return; }
    if (disc > orig) { setFormError('Valor com desconto não pode ser maior que o valor particular.'); return; }

    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        const updated = await api.put(`/providers/services/${editing.id}`, {
          description: form.description,
          originalPrice: orig,
          discountedPrice: disc,
        }) as Service;
        setServices((prev) => prev.map((s) => (s.id === editing.id ? updated : s)));
        showToast('Serviço atualizado com sucesso!');
      } else {
        const created = await api.post(`/providers/${providerId}/services`, {
          description: form.description,
          originalPrice: orig,
          discountedPrice: disc,
        }) as Service;
        setServices((prev) => [...prev, created]);
        showToast('Serviço cadastrado com sucesso!');
      }
      setShowModal(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Erro ao salvar serviço.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja remover este serviço? Esta ação não pode ser desfeita.')) return;
    setDeleting(id);
    try {
      await api.delete(`/providers/services/${id}`);
      setServices((prev) => prev.filter((s) => s.id !== id));
      showToast('Serviço removido.');
    } catch {
      showToast('Erro ao remover serviço.', 'err');
    } finally {
      setDeleting('');
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Meus Serviços</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie os serviços e preços oferecidos pela sua clínica.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#007178] hover:bg-[#005f65] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Novo Serviço
        </button>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${toastType === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toastType === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Wrench size={40} className="mb-3 opacity-30" />
            <p className="font-medium">Nenhum serviço cadastrado</p>
            <p className="text-sm mt-1">Adicione serviços para começar a registrar atendimentos.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-6 py-3 font-bold">Serviço</th>
                <th className="text-right px-6 py-3 font-bold">Valor Particular</th>
                <th className="text-right px-6 py-3 font-bold">Com Desconto</th>
                <th className="text-right px-6 py-3 font-bold">Desconto</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700">{s.description}</td>
                  <td className="px-6 py-4 text-right text-slate-500 line-through">{fmtMoney(s.originalPrice)}</td>
                  <td className="px-6 py-4 text-right font-bold text-[#007178]">{fmtMoney(s.discountedPrice)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                      -{discount(s.originalPrice, s.discountedPrice)}%
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-2 text-slate-400 hover:text-[#007178] hover:bg-teal-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deleting === s.id}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remover"
                      >
                        {deleting === s.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-bold text-slate-800">{editing ? 'Editar Serviço' : 'Novo Serviço'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Descrição</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Ex: Consulta Clínico Geral"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007178]/20 bg-slate-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Valor Particular (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.originalPrice}
                    onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                    placeholder="200.00"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007178]/20 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Com Desconto (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.discountedPrice}
                    onChange={(e) => setForm((f) => ({ ...f, discountedPrice: e.target.value }))}
                    placeholder="140.00"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007178]/20 bg-slate-50"
                  />
                </div>
              </div>
              {form.originalPrice && form.discountedPrice && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700">
                  Desconto: <strong>{discount(parseFloat(form.originalPrice), parseFloat(form.discountedPrice))}%</strong> — Economia de{' '}
                  <strong>{fmtMoney(parseFloat(form.originalPrice) - parseFloat(form.discountedPrice))}</strong>
                </div>
              )}
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg flex items-center gap-2">
                  <AlertCircle size={15} /> {formError}
                </p>
              )}
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-slate-600 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#007178] hover:bg-[#005f65] disabled:opacity-50 text-white py-2.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
