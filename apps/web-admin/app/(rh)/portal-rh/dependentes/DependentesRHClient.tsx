'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, Loader2, Plus, Search, UserPlus, X } from 'lucide-react';

interface Dependente {
  id: string;
  fullName: string;
  cpf: string;
  status: boolean;
  birthDate?: string | null;
  gender?: string | null;
  phone?: string | null;
  kinship?: string | null;
  inactivationReason?: string | null;
  inactivatedAt?: string | null;
  createdAt: string;
  parent?: { id: string; fullName: string; cpf: string } | null;
}

interface Titular {
  id: string;
  fullName: string;
  cpf: string;
}

interface Props {
  dependentes: Dependente[];
  titulares: Titular[];
}

function formatCpf(raw: string) {
  const d = (raw || '').replace(/\D/g, '').slice(0, 11);
  return d.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_m, a, b, c, e) =>
    [a, b, c, e].filter(Boolean).join('').length === 0 ? '' : [a, b ? '.' + b : '', c ? '.' + c : '', e ? '-' + e : ''].join(''),
  );
}

function formatPhone(raw: string) {
  const d = (raw || '').replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, (_m, a, b, c) => `(${a}) ${b}${c ? '-' + c : ''}`);
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, (_m, a, b, c) => `(${a}) ${b}${c ? '-' + c : ''}`);
}

export default function DependentesRHClient({ dependentes, titulares }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [inactivateTarget, setInactivateTarget] = useState<Dependente | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    parentId: '',
    fullName: '',
    cpf: '',
    birthDate: '',
    kinship: '',
    gender: '',
    phone: '',
  });
  const [reason, setReason] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return dependentes;
    const q = search.toLowerCase();
    return dependentes.filter(
      (d) =>
        d.fullName.toLowerCase().includes(q) ||
        d.cpf.includes(q.replace(/\D/g, '')) ||
        (d.parent?.fullName ?? '').toLowerCase().includes(q),
    );
  }, [search, dependentes]);

  function resetForm() {
    setForm({ parentId: '', fullName: '', cpf: '', birthDate: '', kinship: '', gender: '', phone: '' });
    setError('');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.parentId) return setError('Escolha o titular.');
    if (form.fullName.trim().length < 3) return setError('Nome inválido.');
    const cpfDigits = form.cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) return setError('CPF deve ter 11 dígitos.');

    setSubmitting(true);
    try {
      const res = await fetch('/internal/api/portal-rh/dependentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: form.parentId,
          fullName: form.fullName.trim(),
          cpf: cpfDigits,
          birthDate: form.birthDate || undefined,
          kinship: form.kinship.trim() || undefined,
          gender: form.gender.trim() || undefined,
          phone: form.phone.replace(/\D/g, '') || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message?.message || data.message || 'Não foi possível cadastrar.');
        return;
      }
      resetForm();
      setOpenCreate(false);
      router.refresh();
    } catch {
      setError('Erro de conexão.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInactivate() {
    if (!inactivateTarget) return;
    if (reason.trim().length < 3) {
      setError('Motivo obrigatório (mínimo 3 caracteres).');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/internal/api/portal-rh/dependentes/${inactivateTarget.id}/inativar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Não foi possível inativar.');
        return;
      }
      setInactivateTarget(null);
      setReason('');
      router.refresh();
    } catch {
      setError('Erro de conexão.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="text-secondary" /> Dependentes
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Cadastre e gerencie dependentes vinculados aos colaboradores da sua empresa.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setOpenCreate(true); }}
          className="inline-flex items-center gap-2 bg-[#007178] hover:bg-[#005f65] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> Novo dependente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, CPF ou titular..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178]"
            />
          </div>
          <span className="text-xs text-slate-500">
            {filtered.length} de {dependentes.length}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <UserPlus size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum dependente {search ? 'encontrado' : 'cadastrado'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">CPF</th>
                  <th className="px-6 py-3">Titular</th>
                  <th className="px-6 py-3">Parentesco</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-800">{d.fullName}</td>
                    <td className="px-6 py-3 text-slate-500 font-mono text-xs">{formatCpf(d.cpf)}</td>
                    <td className="px-6 py-3 text-slate-600">{d.parent?.fullName ?? '—'}</td>
                    <td className="px-6 py-3 text-slate-500">{d.kinship ?? '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${d.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {d.status ? 'Ativo' : 'Inativo'}
                      </span>
                      {!d.status && d.inactivationReason && (
                        <p className="text-xs text-slate-400 mt-0.5">{d.inactivationReason}</p>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {d.status && (
                        <button
                          onClick={() => { setInactivateTarget(d); setReason(''); setError(''); }}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          <Ban size={13} /> Inativar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Novo dependente</h3>
              <button onClick={() => { setOpenCreate(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Titular *</label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178]"
                >
                  <option value="">Selecione o titular</option>
                  {titulares.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} — {formatCpf(t.cpf)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Nome completo *</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">CPF *</label>
                  <input
                    type="text"
                    value={formatCpf(form.cpf)}
                    onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                    required
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Parentesco</label>
                  <input
                    type="text"
                    value={form.kinship}
                    onChange={(e) => setForm({ ...form, kinship: e.target.value })}
                    placeholder="filho, cônjuge..."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Data de nascimento</label>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Gênero</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178]"
                  >
                    <option value="">—</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="O">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Telefone</label>
                  <input
                    type="tel"
                    value={formatPhone(form.phone)}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178]"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setOpenCreate(false); resetForm(); }}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-[#007178] hover:bg-[#005f65] disabled:opacity-60 text-white font-bold px-4 py-2 rounded-lg text-sm"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Salvar dependente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {inactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Inativar dependente</h3>
              <button onClick={() => { setInactivateTarget(null); setReason(''); setError(''); }} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-slate-600">
                Você está inativando <strong>{inactivateTarget.fullName}</strong>. O beneficiário ficará bloqueado
                para novas transferências por <strong>30 dias</strong>.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Motivo *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  minLength={3}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
                  placeholder="Ex.: desligamento em 01/04/2026"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setInactivateTarget(null); setReason(''); setError(''); }}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleInactivate}
                  disabled={submitting || reason.trim().length < 3}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-lg text-sm"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Confirmar inativação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
