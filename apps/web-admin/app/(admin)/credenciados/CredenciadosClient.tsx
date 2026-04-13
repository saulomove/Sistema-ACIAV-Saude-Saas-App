'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope, Plus, Search, Pencil, Trash2, Star, Loader2, X,
  MapPin, FileText, Wrench, ChevronRight, Save, AlertCircle,
  CheckCircle2, Building2, Phone, Copy, Key, Camera, ImageIcon,
} from 'lucide-react';
import Modal from '../../../components/Modal';
import { api } from '../../../lib/api-client';

interface Service {
  id: string;
  description: string;
  originalPrice: number;
  insurancePrice: number;
  discountedPrice: number;
  discountType: string;
  discountValue: number;
}

interface Provider {
  id: string;
  name: string;
  professionalName?: string | null;
  clinicName?: string | null;
  registration?: string | null;
  cpfCnpj?: string | null;
  category: string;
  specialty?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  rankingScore: number;
  bio?: string | null;
  status?: boolean;
  _count?: { transactions: number };
}

const CATEGORIES = [
  'Consultas', 'Exames', 'Medicamentos', 'Odontologia', 'Fisioterapia',
  'Laboratório', 'Terapias', 'Nutrição', 'Psicologia', 'Oftalmologia', 'Outro',
];

const CATEGORY_STYLE: Record<string, string> = {
  Consultas: 'bg-blue-50 text-blue-700',
  Exames: 'bg-cyan-50 text-cyan-700',
  Medicamentos: 'bg-orange-50 text-orange-700',
  Odontologia: 'bg-emerald-50 text-emerald-700',
  Fisioterapia: 'bg-rose-50 text-rose-700',
  Laboratório: 'bg-cyan-50 text-cyan-700',
  Terapias: 'bg-purple-50 text-purple-700',
  Nutrição: 'bg-lime-50 text-lime-700',
  Psicologia: 'bg-indigo-50 text-indigo-700',
  Oftalmologia: 'bg-sky-50 text-sky-700',
};

const EMPTY_FORM = {
  professionalName: '', clinicName: '', registration: '', cpfCnpj: '',
  category: 'Consultas', specialty: '', address: '', phone: '', whatsapp: '',
  email: '', bio: '',
};

const EMPTY_SERVICE_FORM = { description: '', originalPrice: '', insurancePrice: '', discountedPrice: '', discountType: 'fixed', discountValue: '' };

function fmtMoney(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function discountPct(orig: number, disc: number) {
  if (!orig || orig === 0) return 0;
  return Math.round(((orig - disc) / orig) * 100);
}

function formatCpfCnpj(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

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

  // Provider modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Drawer
  const [drawerProvider, setDrawerProvider] = useState<Provider | null>(null);
  const [drawerTab, setDrawerTab] = useState<'perfil' | 'servicos'>('perfil');

  // Services
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE_FORM);
  const [serviceFormError, setServiceFormError] = useState('');
  const [savingService, setSavingService] = useState(false);
  const [deletingService, setDeletingService] = useState('');
  const [serviceToast, setServiceToast] = useState('');
  const [serviceToastType, setServiceToastType] = useState<'ok' | 'err'>('ok');

  // Photo upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Reset password
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetResult, setResetResult] = useState<{ tempPassword: string; email: string } | null>(null);

  // Copied feedback
  const [copied, setCopied] = useState(false);

  const providerList = providers as Provider[];
  const categories = Array.from(new Set(providerList.map((p) => p.category).filter(Boolean)));

  const lista = providerList.filter((p) => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.specialty ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.professionalName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.clinicName ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'todos' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  useEffect(() => {
    if (drawerProvider && drawerTab === 'servicos') {
      loadServices(drawerProvider.id);
    }
  }, [drawerProvider, drawerTab]);

  async function loadServices(providerId: string) {
    setServicesLoading(true);
    try {
      const data = await api.get(`/providers/${providerId}/services`) as Service[];
      setServices(Array.isArray(data) ? data : []);
    } catch {
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  }

  function openDrawer(p: Provider) {
    setDrawerProvider(p);
    setDrawerTab('perfil');
    setServices([]);
    setServiceModalOpen(false);
    setResetResult(null);
  }

  function closeDrawer() {
    setDrawerProvider(null);
    setServices([]);
    setServiceModalOpen(false);
  }

  function copyCredentials(email: string, password: string) {
    navigator.clipboard.writeText(`Login: ${email}\nSenha: ${password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleUploadPhoto(providerId: string, file: File) {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/internal/api/providers/' + providerId + '/photo', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Erro no upload');
      const data = await res.json();
      if (drawerProvider) {
        setDrawerProvider({ ...drawerProvider, photoUrl: data.photoUrl });
      }
      startTransition(() => router.refresh());
    } catch {
      alert('Erro ao enviar foto. Use JPG, PNG ou WebP até 2MB.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleResetPassword(providerId: string) {
    if (!confirm('Resetar a senha deste credenciado? Todas as sessões ativas serão encerradas.')) return;
    setResettingPassword(true);
    setResetResult(null);
    try {
      const result = await api.post(`/auth/reset-password/provider/${providerId}`, {}) as { tempPassword: string; email: string };
      setResetResult(result);
    } catch {
      alert('Erro ao resetar senha. Verifique se o credenciado possui login cadastrado.');
    } finally {
      setResettingPassword(false);
    }
  }

  // ── Provider CRUD ──────────────────────────────────────────────────────────

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setTempPassword(null);
    setModalOpen(true);
  }

  function openEdit(p: Provider, e?: React.MouseEvent) {
    e?.stopPropagation();
    setEditingId(p.id);
    setForm({
      professionalName: p.professionalName ?? '',
      clinicName: p.clinicName ?? '',
      registration: p.registration ?? '',
      cpfCnpj: p.cpfCnpj ?? '',
      category: p.category,
      specialty: p.specialty ?? '',
      address: p.address ?? '',
      phone: p.phone ?? '',
      whatsapp: p.whatsapp ?? '',
      email: p.email ?? '',
      bio: p.bio ?? '',
    });
    setError('');
    setTempPassword(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.professionalName.trim() && !form.clinicName.trim()) {
      setError('Informe o nome do profissional ou da clínica.');
      return;
    }
    if (!form.email.trim() && !editingId) {
      setError('E-mail é obrigatório (será o login do credenciado).');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        unitId,
        name: form.clinicName.trim() || form.professionalName.trim(),
        professionalName: form.professionalName.trim() || undefined,
        clinicName: form.clinicName.trim() || undefined,
        registration: form.registration.trim() || undefined,
        cpfCnpj: form.cpfCnpj.replace(/\D/g, '') || undefined,
        category: form.category,
        specialty: form.specialty.trim() || undefined,
        address: form.address.trim() || undefined,
        phone: form.phone.replace(/\D/g, '') || undefined,
        whatsapp: form.whatsapp.replace(/\D/g, '') || undefined,
        email: form.email.trim() || undefined,
        bio: form.bio.trim() || undefined,
      };

      if (editingId) {
        await api.put(`/providers/${editingId}`, payload);
        setModalOpen(false);
      } else {
        const result = await api.post('/providers', payload);
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

  async function handleToggleStatus(p: Provider, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await api.patch(`/providers/${p.id}/status`, { status: !(p.status ?? true) });
      startTransition(() => router.refresh());
    } catch {
      alert('Erro ao alterar status.');
    }
  }

  async function handleDelete(p: Provider, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Inativar "${p.name}"?`)) return;
    try {
      await api.delete(`/providers/${p.id}`);
      startTransition(() => router.refresh());
    } catch {
      alert('Erro ao inativar credenciado.');
    }
  }

  // ── Service CRUD ───────────────────────────────────────────────────────────

  function showServiceToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setServiceToast(msg);
    setServiceToastType(type);
    setTimeout(() => setServiceToast(''), 3500);
  }

  function openCreateService() {
    setEditingService(null);
    setServiceForm(EMPTY_SERVICE_FORM);
    setServiceFormError('');
    setServiceModalOpen(true);
  }

  function openEditService(s: Service) {
    setEditingService(s);
    setServiceForm({
      description: s.description,
      originalPrice: String(s.originalPrice),
      insurancePrice: String(s.insurancePrice ?? 0),
      discountedPrice: String(s.discountedPrice),
      discountType: s.discountType ?? 'fixed',
      discountValue: s.discountValue ? String(s.discountValue) : '',
    });
    setServiceFormError('');
    setServiceModalOpen(true);
  }

  async function handleSaveService() {
    if (!serviceForm.description.trim()) { setServiceFormError('Informe a descrição do serviço.'); return; }
    const orig = parseFloat(serviceForm.originalPrice.replace(',', '.'));
    const ins = parseFloat(serviceForm.insurancePrice.replace(',', '.') || '0');
    const disc = parseFloat(serviceForm.discountedPrice.replace(',', '.'));
    if (isNaN(orig) || orig <= 0) { setServiceFormError('Informe um valor particular válido.'); return; }
    if (isNaN(disc) || disc < 0) { setServiceFormError('Informe um valor ACIAV válido.'); return; }
    if (disc > orig) { setServiceFormError('Valor ACIAV não pode ser maior que o valor particular.'); return; }

    setSavingService(true);
    setServiceFormError('');
    try {
      const discVal = parseFloat(serviceForm.discountValue.replace(',', '.') || '0');
      if (editingService) {
        const updated = await api.put(`/providers/services/${editingService.id}`, {
          description: serviceForm.description,
          originalPrice: orig,
          insurancePrice: isNaN(ins) ? 0 : ins,
          discountedPrice: disc,
          discountType: serviceForm.discountType,
          discountValue: isNaN(discVal) ? 0 : discVal,
        }) as Service;
        setServices((prev) => prev.map((s) => (s.id === editingService.id ? updated : s)));
        showServiceToast('Serviço atualizado!');
      } else {
        const created = await api.post(`/providers/${drawerProvider!.id}/services`, {
          description: serviceForm.description,
          originalPrice: orig,
          insurancePrice: isNaN(ins) ? 0 : ins,
          discountedPrice: disc,
          discountType: serviceForm.discountType,
          discountValue: isNaN(discVal) ? 0 : discVal,
        }) as Service;
        setServices((prev) => [...prev, created]);
        showServiceToast('Serviço cadastrado!');
      }
      setServiceModalOpen(false);
    } catch (e: unknown) {
      setServiceFormError(e instanceof Error ? e.message : 'Erro ao salvar serviço.');
    } finally {
      setSavingService(false);
    }
  }

  async function handleDeleteService(id: string) {
    if (!confirm('Remover este serviço?')) return;
    setDeletingService(id);
    try {
      await api.delete(`/providers/services/${id}`);
      setServices((prev) => prev.filter((s) => s.id !== id));
      showServiceToast('Serviço removido.');
    } catch {
      showServiceToast('Erro ao remover serviço.', 'err');
    } finally {
      setDeletingService('');
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-3 bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, especialidade..."
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
                  <th className="px-6 py-4">Especialidade</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lista.map((p) => {
                  const style = CATEGORY_STYLE[p.category] ?? 'bg-slate-50 text-slate-600';
                  return (
                    <tr
                      key={p.id}
                      onClick={() => openDrawer(p)}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-800 group-hover:text-primary transition-colors">
                            {p.name}
                          </span>
                          <ChevronRight size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                        </div>
                        {p.professionalName && p.clinicName && (
                          <p className="text-xs text-slate-400 mt-0.5">{p.professionalName}</p>
                        )}
                        {p.whatsapp && (
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <Phone size={10} />{p.whatsapp}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${style}`}>
                          {p.category || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{p.specialty || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-amber-500 font-medium">
                          <Star size={15} fill="currentColor" strokeWidth={0} />
                          {(p.rankingScore ?? 0).toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => handleToggleStatus(p, e)}
                          className={`inline-flex px-2 py-1 text-xs font-bold rounded-full hover:opacity-75 transition-opacity ${(p.status ?? true) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                        >
                          {(p.status ?? true) ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                            className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(p, e)}
                            className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Inativar"
                          >
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

      {/* ── Drawer ─────────────────────────────────────────────────────────── */}
      {drawerProvider && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="fixed right-0 top-0 h-full w-full max-w-xl z-50 bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">

            {/* Drawer header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                {drawerProvider.photoUrl ? (
                  <img src={drawerProvider.photoUrl} alt="" className="w-11 h-11 rounded-xl object-cover" />
                ) : (
                  <div className={`p-2.5 rounded-xl ${CATEGORY_STYLE[drawerProvider.category] ?? 'bg-slate-100 text-slate-600'}`}>
                    <Building2 size={20} />
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-slate-800 text-lg leading-tight">{drawerProvider.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_STYLE[drawerProvider.category] ?? 'bg-slate-100 text-slate-600'}`}>
                      {drawerProvider.category}
                    </span>
                    {drawerProvider.specialty && (
                      <span className="text-xs text-slate-500">{drawerProvider.specialty}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 bg-white shrink-0">
              <button
                onClick={() => setDrawerTab('perfil')}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${drawerTab === 'perfil' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <FileText size={15} /> Perfil
              </button>
              <button
                onClick={() => setDrawerTab('servicos')}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${drawerTab === 'servicos' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <Wrench size={15} /> Serviços
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto">

              {/* ── Perfil tab ── */}
              {drawerTab === 'perfil' && (
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 font-medium mb-1">Avaliação</p>
                      <div className="flex items-center gap-1.5 text-amber-500 font-bold text-xl">
                        <Star size={18} fill="currentColor" strokeWidth={0} />
                        {(drawerProvider.rankingScore ?? 0).toFixed(1)}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 font-medium mb-1">Atendimentos</p>
                      <p className="font-bold text-xl text-slate-800">{drawerProvider._count?.transactions ?? 0}</p>
                    </div>
                  </div>

                  {/* Info cards */}
                  <div className="space-y-3">
                    {drawerProvider.professionalName && (
                      <div className="bg-slate-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Profissional</p>
                        <p className="text-sm text-slate-700 font-medium mt-0.5">{drawerProvider.professionalName}</p>
                      </div>
                    )}
                    {drawerProvider.clinicName && (
                      <div className="bg-slate-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Clínica</p>
                        <p className="text-sm text-slate-700 font-medium mt-0.5">{drawerProvider.clinicName}</p>
                      </div>
                    )}
                    {drawerProvider.registration && (
                      <div className="bg-slate-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Registro Profissional</p>
                        <p className="text-sm text-slate-700 font-medium mt-0.5">{drawerProvider.registration}</p>
                      </div>
                    )}
                    {drawerProvider.cpfCnpj && (
                      <div className="bg-slate-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">CPF/CNPJ</p>
                        <p className="text-sm text-slate-700 font-mono mt-0.5">{drawerProvider.cpfCnpj}</p>
                      </div>
                    )}
                    {drawerProvider.address && (
                      <div className="bg-slate-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Endereço</p>
                        <div className="flex items-start gap-2 text-slate-700 text-sm mt-0.5">
                          <MapPin size={15} className="mt-0.5 text-slate-400 shrink-0" />
                          {drawerProvider.address}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {drawerProvider.phone && (
                        <div className="bg-slate-50 rounded-xl px-4 py-3">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Telefone</p>
                          <p className="text-sm text-slate-700 mt-0.5">{drawerProvider.phone}</p>
                        </div>
                      )}
                      {drawerProvider.whatsapp && (
                        <div className="bg-slate-50 rounded-xl px-4 py-3">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">WhatsApp</p>
                          <p className="text-sm text-slate-700 mt-0.5">{drawerProvider.whatsapp}</p>
                        </div>
                      )}
                    </div>
                    {drawerProvider.bio && (
                      <div className="bg-slate-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Sobre</p>
                        <p className="text-sm text-slate-700 mt-0.5 leading-relaxed">{drawerProvider.bio}</p>
                      </div>
                    )}
                  </div>

                  {/* Foto / Logo */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-3">Foto / Logomarca</p>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                        {drawerProvider.photoUrl ? (
                          <img src={drawerProvider.photoUrl} alt="Foto" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <ImageIcon size={28} className="text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="block">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadPhoto(drawerProvider.id, file);
                              e.target.value = '';
                            }}
                          />
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors ${uploadingPhoto ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
                            {uploadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                            {uploadingPhoto ? 'Enviando...' : 'Enviar Foto'}
                          </span>
                        </label>
                        <p className="text-xs text-slate-400">JPG, PNG ou WebP. Tamanho ideal: <strong>400x400px</strong>. Máximo: 2MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Login info */}
                  {drawerProvider.email && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-blue-600 font-bold uppercase tracking-wide flex items-center gap-1"><Key size={12} /> Login do Credenciado</p>
                          <p className="text-sm text-blue-800 font-medium mt-0.5">{drawerProvider.email}</p>
                        </div>
                        <button
                          onClick={() => handleResetPassword(drawerProvider.id)}
                          disabled={resettingPassword}
                          className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                        >
                          {resettingPassword ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
                          {resettingPassword ? 'Resetando...' : 'Resetar Senha'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reset password result */}
                  {resetResult && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                        <p className="text-sm font-bold text-emerald-800">Nova senha temporária gerada!</p>
                      </div>
                      <p className="text-xs text-emerald-700">Compartilhe as credenciais abaixo com o credenciado. No próximo acesso ele poderá trocar a senha.</p>
                      <div className="bg-white border border-emerald-200 rounded-lg px-4 py-3 space-y-1">
                        <p className="text-xs text-slate-500">Login: <span className="font-bold text-slate-800">{resetResult.email}</span></p>
                        <p className="text-xs text-slate-500">Senha temporária: <span className="font-bold font-mono text-slate-800">{resetResult.tempPassword}</span></p>
                      </div>
                      <button
                        onClick={() => { copyCredentials(resetResult.email, resetResult.tempPassword); }}
                        className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Copy size={14} /> {copied ? 'Copiado!' : 'Copiar Credenciais'}
                      </button>
                      <p className="text-xs text-amber-700 font-medium">Anote a senha — ela não será exibida novamente.</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Status</p>
                    <span className={`inline-flex px-3 py-1.5 text-sm font-bold rounded-full ${(drawerProvider.status ?? true) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {(drawerProvider.status ?? true) ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={() => openEdit(drawerProvider)}
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-xl font-medium transition-colors"
                    >
                      <Pencil size={16} /> Editar Perfil
                    </button>
                  </div>
                </div>
              )}

              {/* ── Serviços tab ── */}
              {drawerTab === 'servicos' && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      {servicesLoading ? 'Carregando...' : `${services.length} serviço(s)`}
                    </p>
                    <button
                      onClick={openCreateService}
                      className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                      <Plus size={15} /> Adicionar
                    </button>
                  </div>

                  {serviceToast && (
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${serviceToastType === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {serviceToastType === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {serviceToast}
                    </div>
                  )}

                  {servicesLoading ? (
                    <div className="flex items-center justify-center py-12 text-slate-400">
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                  ) : services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 rounded-2xl">
                      <Wrench size={36} className="mb-3 opacity-30" />
                      <p className="font-medium text-sm">Nenhum serviço cadastrado</p>
                      <p className="text-xs mt-1">Clique em &quot;Adicionar&quot; para começar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {services.map((s) => (
                        <div key={s.id} className="bg-slate-50 rounded-xl p-4 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm">{s.description}</p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className="text-xs text-slate-400 line-through">{fmtMoney(s.originalPrice)}</span>
                              {Number(s.insurancePrice) > 0 && (
                                <span className="text-xs text-blue-600">Conv: {fmtMoney(s.insurancePrice)}</span>
                              )}
                              <span className="text-sm font-bold text-[#007178]">{fmtMoney(s.discountedPrice)}</span>
                              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                -{discountPct(s.originalPrice, s.discountedPrice)}%
                              </span>
                              <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">
                                {s.discountType === 'percentage' ? 'Percentual' : 'Valor Fixo'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openEditService(s)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteService(s.id)}
                              disabled={deletingService === s.id}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Remover"
                            >
                              {deletingService === s.id
                                ? <Loader2 size={14} className="animate-spin" />
                                : <Trash2 size={14} />
                              }
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Service modal (inside drawer) ─────────────────────────────────── */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-bold text-slate-800">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button onClick={() => setServiceModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Descrição do serviço *</label>
                <input
                  type="text"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Ex: Consulta Clínico Geral"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Particular (R$)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={serviceForm.originalPrice}
                    onChange={(e) => setServiceForm((f) => ({ ...f, originalPrice: e.target.value }))}
                    placeholder="200.00"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Convênio (R$)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={serviceForm.insurancePrice}
                    onChange={(e) => setServiceForm((f) => ({ ...f, insurancePrice: e.target.value }))}
                    placeholder="180.00"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ACIAV (R$)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={serviceForm.discountedPrice}
                    onChange={(e) => setServiceForm((f) => ({ ...f, discountedPrice: e.target.value }))}
                    placeholder="140.00"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tipo de Desconto</label>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm ${serviceForm.discountType === 'fixed' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/40'}`}>
                    <input type="radio" name="svcDiscountType" value="fixed" checked={serviceForm.discountType === 'fixed'} onChange={(e) => setServiceForm((f) => ({ ...f, discountType: e.target.value }))} className="accent-primary" />
                    <span className="font-medium text-slate-700">Valor Fixo (R$)</span>
                  </label>
                  <label className={`flex-1 flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm ${serviceForm.discountType === 'percentage' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/40'}`}>
                    <input type="radio" name="svcDiscountType" value="percentage" checked={serviceForm.discountType === 'percentage'} onChange={(e) => setServiceForm((f) => ({ ...f, discountType: e.target.value }))} className="accent-primary" />
                    <span className="font-medium text-slate-700">Percentual (%)</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {serviceForm.discountType === 'percentage' ? 'Percentual de Desconto (%)' : 'Valor do Desconto (R$)'}
                </label>
                <input
                  type="number" step="0.01" min="0"
                  value={serviceForm.discountValue}
                  onChange={(e) => setServiceForm((f) => ({ ...f, discountValue: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 text-sm"
                  placeholder={serviceForm.discountType === 'percentage' ? 'Ex: 30' : 'Ex: 50.00'}
                />
              </div>
              {serviceForm.originalPrice && serviceForm.discountedPrice && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700">
                  Desconto:{' '}
                  <strong>
                    {discountPct(parseFloat(serviceForm.originalPrice), parseFloat(serviceForm.discountedPrice))}%
                  </strong>
                  {' '}— Economia de{' '}
                  <strong>
                    {fmtMoney(parseFloat(serviceForm.originalPrice) - parseFloat(serviceForm.discountedPrice))}
                  </strong>
                </div>
              )}
              {serviceFormError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg flex items-center gap-2">
                  <AlertCircle size={15} /> {serviceFormError}
                </p>
              )}
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setServiceModalOpen(false)}
                className="flex-1 border border-gray-200 text-slate-600 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveService}
                disabled={savingService}
                className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-2.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                {savingService ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {savingService ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Provider modal (create/edit) ───────────────────────────────────── */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setTempPassword(null); }} title={editingId ? 'Editar Credenciado' : 'Novo Credenciado'}>
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">

          {/* ── Tela de credenciais (após criar) ── */}
          {tempPassword && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <p className="text-sm font-bold text-emerald-800">Credenciado criado com sucesso!</p>
              </div>
              <p className="text-xs text-emerald-700">Compartilhe as credenciais abaixo com o credenciado. No primeiro acesso ele poderá trocar a senha.</p>
              <div className="bg-white border border-emerald-200 rounded-lg px-4 py-3 space-y-1">
                <p className="text-xs text-slate-500">Login: <span className="font-bold text-slate-800">{form.email}</span></p>
                <p className="text-xs text-slate-500">Senha temporária: <span className="font-bold font-mono text-slate-800">{tempPassword}</span></p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyCredentials(form.email, tempPassword)}
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Copy size={14} /> {copied ? 'Copiado!' : 'Copiar Credenciais'}
                </button>
                <button
                  onClick={() => { setModalOpen(false); setTempPassword(null); }}
                  className="flex-1 border border-emerald-300 text-emerald-700 py-2 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors"
                >
                  Fechar
                </button>
              </div>
              <p className="text-xs text-amber-700 font-medium">Anote a senha — ela não será exibida novamente.</p>
            </div>
          )}

          {/* ── Formulário ── */}
          {!tempPassword && (
            <>
              {/* Seção 1: Identificação */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">1</div>
                  <h3 className="text-sm font-bold text-slate-700">Identificação do Profissional / Clínica</h3>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Profissional de Saúde *</label>
                  <p className="text-xs text-slate-400 mb-1.5">Nome completo do médico, dentista, fisioterapeuta, etc.</p>
                  <input
                    type="text"
                    value={form.professionalName}
                    onChange={(e) => setForm({ ...form, professionalName: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                    placeholder="Dr. João Silva"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Clínica / Estabelecimento</label>
                  <p className="text-xs text-slate-400 mb-1.5">Deixe em branco se for profissional autônomo</p>
                  <input
                    type="text"
                    value={form.clinicName}
                    onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                    placeholder="Clínica Saúde Total"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Registro Profissional</label>
                    <p className="text-xs text-slate-400 mb-1.5">CRM, CREFITO, CRO, etc.</p>
                    <input
                      type="text"
                      value={form.registration}
                      onChange={(e) => setForm({ ...form, registration: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                      placeholder="CRM 12345/SP"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">CPF / CNPJ *</label>
                    <p className="text-xs text-slate-400 mb-1.5">Documento do profissional ou empresa</p>
                    <input
                      type="text"
                      value={form.cpfCnpj}
                      onChange={(e) => setForm({ ...form, cpfCnpj: formatCpfCnpj(e.target.value) })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 font-mono"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Contato */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">2</div>
                  <h3 className="text-sm font-bold text-slate-700">Contato e Localização</h3>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Endereço completo</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Telefone Fixo</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">WhatsApp *</label>
                    <input
                      type="text"
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: formatPhone(e.target.value) })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">E-mail *</label>
                  <p className="text-xs text-slate-400 mb-1.5">Será usado como login do credenciado na plataforma</p>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                    placeholder="contato@clinica.com.br"
                  />
                </div>
              </div>

              {/* Seção 3: Categoria e Informações */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">3</div>
                  <h3 className="text-sm font-bold text-slate-700">Categoria e Informações</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Especialidade</label>
                    <input
                      type="text"
                      value={form.specialty}
                      onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                      placeholder="Pediatra, Cardiologista..."
                    />
                  </div>
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

                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                  <strong>Dica:</strong> Os descontos e valores são configurados individualmente em cada serviço, na aba &quot;Serviços&quot; do credenciado.
                </div>
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
                  {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Credenciado'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
