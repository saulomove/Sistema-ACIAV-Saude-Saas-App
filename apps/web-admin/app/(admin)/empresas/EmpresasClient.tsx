'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building, Plus, Search, Pencil, Trash2, FileSpreadsheet,
  Users, Loader2, X, MapPin, Phone, Key, Copy, CheckCircle2, AlertCircle,
  ChevronRight, Save, FileText, Upload, Calendar,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from '../../../components/Modal';
import ExportExcelButton from '../../../components/ExportExcelButton';
import { api } from '../../../lib/api-client';

interface Company {
  id: string;
  externalCode?: string | null;
  corporateName: string;
  tradeName?: string | null;
  cnpj?: string | null;
  adminEmail?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  zipCode?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  memberSince?: string | null;
  status: boolean;
  dependentPaymentMode?: 'titular' | 'empresa' | null;
  defaultCardType?: 'app' | 'physical' | null;
  _count?: { users: number };
}

interface CompanyStats {
  total: number;
  active: number;
  totalUsers: number;
}

interface ImportRow {
  externalCode: string;
  corporateName: string;
  tradeName: string;
  cnpj: string;
  address: string;
  neighborhood: string;
  zipCode: string;
  city: string;
  state: string;
  memberSince: string;
}

const EMPTY_FORM = {
  externalCode: '', corporateName: '', tradeName: '', cnpj: '',
  adminEmail: '', address: '', neighborhood: '', zipCode: '',
  city: '', state: '', phone: '', memberSince: '',
  dependentPaymentMode: 'titular' as 'titular' | 'empresa',
  defaultCardType: 'app' as 'app' | 'physical',
};

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

function formatCnpj(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function displayCnpj(cnpj?: string | null) {
  if (!cnpj) return '—';
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return formatCnpj(d);
}

function formatPhone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  } catch { return dateStr; }
}

// Column mapping from Excel to system fields
const COLUMN_MAP: Record<string, keyof ImportRow> = {
  'código cliente': 'externalCode',
  'codigo cliente': 'externalCode',
  'proponente': 'corporateName',
  'nome_fantasia': 'tradeName',
  'nome fantasia': 'tradeName',
  'cnpj': 'cnpj',
  'endereço': 'address',
  'endereco': 'address',
  'bairro': 'neighborhood',
  'cep': 'zipCode',
  'cidade': 'city',
  'estado': 'state',
  'inclusão': 'memberSince',
  'inclusao': 'memberSince',
};

function mapExcelRow(row: Record<string, unknown>): ImportRow {
  const mapped: Record<string, string> = {};
  for (const [excelKey, value] of Object.entries(row)) {
    const normalizedKey = excelKey.toLowerCase().trim();
    const systemKey = COLUMN_MAP[normalizedKey];
    if (systemKey) {
      let strVal = String(value ?? '').trim();
      // externalCode: remove .0 suffix from numeric values
      if (systemKey === 'externalCode') {
        strVal = strVal.replace(/\.0$/, '');
      }
      // CNPJ: keep only digits
      if (systemKey === 'cnpj') {
        strVal = strVal.replace(/\D/g, '');
      }
      mapped[systemKey] = strVal;
    }
  }
  return mapped as unknown as ImportRow;
}

function parseDateBR(dateStr: string): string {
  // Converts "13/11/2023" or "2023-11-13" to ISO
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

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

  // Provider modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Drawer
  const [drawerCompany, setDrawerCompany] = useState<Company | null>(null);

  // Import modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset password
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetResult, setResetResult] = useState<{ tempPassword: string; email: string } | null>(null);

  // Copied feedback
  const [copied, setCopied] = useState(false);

  const lista = (companies as Company[]).filter(
    (c) =>
      !search ||
      c.corporateName.toLowerCase().includes(search.toLowerCase()) ||
      (c.tradeName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.cnpj ?? '').includes(search) ||
      (c.city ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // ── Drawer ──────────────────────────────────────────────────────────────

  function openDrawer(c: Company) {
    setDrawerCompany(c);
    setResetResult(null);
  }

  function closeDrawer() {
    setDrawerCompany(null);
    setResetResult(null);
  }

  // ── Copy credentials ──────────────────────────────────────────────────

  function copyCredentials(email: string, password: string) {
    navigator.clipboard.writeText(`Login: ${email}\nSenha: ${password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // ── Reset password ────────────────────────────────────────────────────

  async function handleResetPassword(companyId: string) {
    if (!confirm('Resetar a senha do RH desta empresa? Todas as sessões ativas serão encerradas.')) return;
    setResettingPassword(true);
    setResetResult(null);
    try {
      const result = await api.post(`/auth/reset-password/company/${companyId}`, {}) as { tempPassword: string; email: string };
      setResetResult(result);
    } catch {
      alert('Erro ao resetar senha. Verifique se a empresa possui login cadastrado.');
    } finally {
      setResettingPassword(false);
    }
  }

  // ── CRUD ────────────────────────────────────────────────────────────────

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setTempPassword(null);
    setModalOpen(true);
  }

  function openEdit(c: Company, e?: React.MouseEvent) {
    e?.stopPropagation();
    setEditingId(c.id);
    setForm({
      externalCode: c.externalCode ?? '',
      corporateName: c.corporateName,
      tradeName: c.tradeName ?? '',
      cnpj: c.cnpj ?? '',
      adminEmail: c.adminEmail ?? '',
      address: c.address ?? '',
      neighborhood: c.neighborhood ?? '',
      zipCode: c.zipCode ?? '',
      city: c.city ?? '',
      state: c.state ?? '',
      phone: c.phone ?? '',
      memberSince: c.memberSince ? c.memberSince.slice(0, 10) : '',
      dependentPaymentMode: (c.dependentPaymentMode ?? 'titular') as 'titular' | 'empresa',
      defaultCardType: (c.defaultCardType ?? 'app') as 'app' | 'physical',
    });
    setError('');
    setTempPassword(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.corporateName.trim()) {
      setError('Razão social é obrigatória.');
      return;
    }
    if (!editingId && !form.cnpj.trim()) {
      setError('CNPJ é obrigatório.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        corporateName: form.corporateName.trim(),
        tradeName: form.tradeName.trim() || undefined,
        adminEmail: form.adminEmail.trim() || undefined,
        address: form.address.trim() || undefined,
        neighborhood: form.neighborhood.trim() || undefined,
        zipCode: form.zipCode.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state || undefined,
        phone: form.phone.replace(/\D/g, '') || undefined,
        externalCode: form.externalCode.trim() || undefined,
        memberSince: form.memberSince || undefined,
        dependentPaymentMode: form.dependentPaymentMode,
        defaultCardType: form.defaultCardType,
      };

      if (editingId) {
        await api.put(`/companies/${editingId}`, payload);
        setModalOpen(false);
        if (drawerCompany && drawerCompany.id === editingId) {
          setDrawerCompany({ ...drawerCompany, ...payload } as Company);
        }
      } else {
        payload.unitId = unitId;
        payload.cnpj = form.cnpj.replace(/\D/g, '');
        const result = await api.post('/companies', payload);
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

  async function handleToggleStatus(c: Company, e?: React.MouseEvent) {
    e?.stopPropagation();
    try {
      await api.patch(`/companies/${c.id}/status`, { status: !c.status });
      startTransition(() => router.refresh());
    } catch {
      alert('Erro ao alterar status.');
    }
  }

  async function handleDelete(c: Company, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Inativar "${c.corporateName}"? Os beneficiários vinculados serão preservados.`)) return;
    try {
      await api.delete(`/companies/${c.id}`);
      startTransition(() => router.refresh());
    } catch {
      alert('Erro ao inativar empresa.');
    }
  }

  // ── Import ──────────────────────────────────────────────────────────────

  function openImportModal() {
    setImportData([]);
    setImportResult(null);
    setImportModalOpen(true);
  }

  function handleFileSelect(file: File) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
        const mapped = json.map(mapExcelRow).filter((r) => r.cnpj && r.corporateName);
        setImportData(mapped);
        setImportResult(null);
      } catch {
        alert('Erro ao ler arquivo. Verifique se é um arquivo .xls ou .xlsx válido.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    if (importData.length === 0) return;
    setImporting(true);
    try {
      const payload = importData.map((row) => ({
        ...row,
        memberSince: parseDateBR(row.memberSince),
      }));
      const result = await api.post('/companies/import', { companies: payload }) as {
        created: number; skipped: number; errors: string[];
      };
      setImportResult(result);
      startTransition(() => router.refresh());
    } catch {
      alert('Erro ao importar empresas.');
    } finally {
      setImporting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

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
            {(companies as Company[]).length} empresas — {lista.length} exibidas
            {isPending && <span className="ml-2 text-primary animate-pulse">atualizando...</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openImportModal}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
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

      {/* Cards */}
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
              placeholder="Buscar por nome, CNPJ ou cidade..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <ExportExcelButton endpoint="companies" />
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
                  <th className="px-6 py-4">Empresa</th>
                  <th className="px-6 py-4">CNPJ</th>
                  <th className="px-6 py-4">Cidade</th>
                  <th className="px-6 py-4">Beneficiários</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lista.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => openDrawer(emp)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-800 group-hover:text-primary transition-colors">
                          {emp.tradeName || emp.corporateName}
                        </span>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                      {emp.tradeName && (
                        <p className="text-xs text-slate-400 mt-0.5">{emp.corporateName}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{displayCnpj(emp.cnpj)}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {emp.city ? `${emp.city}${emp.state ? `/${emp.state}` : ''}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md text-slate-700 font-semibold text-xs border border-slate-200">
                        {emp._count?.users ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => handleToggleStatus(emp, e)}
                        className={`inline-flex px-2 py-1 text-xs font-bold rounded-full cursor-pointer hover:opacity-75 transition-opacity ${emp.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {emp.status ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => openEdit(emp, e)}
                          className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(emp, e)}
                          className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Inativar"
                        >
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

      {/* ── Drawer ─────────────────────────────────────────────────────────── */}
      {drawerCompany && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="fixed right-0 top-0 h-full w-full max-w-xl z-50 bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">

            {/* Drawer header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <Building size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-lg leading-tight">
                    {drawerCompany.tradeName || drawerCompany.corporateName}
                  </h2>
                  {drawerCompany.tradeName && (
                    <p className="text-xs text-slate-500 mt-0.5">{drawerCompany.corporateName}</p>
                  )}
                </div>
              </div>
              <button
                onClick={closeDrawer}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-medium mb-1">Beneficiários</p>
                  <p className="font-bold text-xl text-slate-800">{drawerCompany._count?.users ?? 0}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-medium mb-1">Código Cliente</p>
                  <p className="font-bold text-xl text-slate-800">{drawerCompany.externalCode || '—'}</p>
                </div>
              </div>

              {/* Info cards */}
              <div className="space-y-3">
                {drawerCompany.cnpj && (
                  <div className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">CNPJ</p>
                    <p className="text-sm text-slate-700 font-mono mt-0.5">{displayCnpj(drawerCompany.cnpj)}</p>
                  </div>
                )}
                {drawerCompany.address && (
                  <div className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Endereço</p>
                    <div className="flex items-start gap-2 text-slate-700 text-sm mt-0.5">
                      <MapPin size={15} className="mt-0.5 text-slate-400 shrink-0" />
                      <span>
                        {drawerCompany.address}
                        {drawerCompany.neighborhood ? `, ${drawerCompany.neighborhood}` : ''}
                        {drawerCompany.zipCode ? ` — CEP ${drawerCompany.zipCode}` : ''}
                      </span>
                    </div>
                  </div>
                )}
                {(drawerCompany.city || drawerCompany.state) && (
                  <div className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Cidade / Estado</p>
                    <p className="text-sm text-slate-700 mt-0.5">
                      {drawerCompany.city ?? ''}{drawerCompany.state ? ` — ${drawerCompany.state}` : ''}
                    </p>
                  </div>
                )}
                {drawerCompany.phone && (
                  <div className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Telefone</p>
                    <div className="flex items-center gap-2 text-sm text-slate-700 mt-0.5">
                      <Phone size={14} className="text-slate-400" />
                      {drawerCompany.phone}
                    </div>
                  </div>
                )}
                {drawerCompany.memberSince && (
                  <div className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Membro desde</p>
                    <div className="flex items-center gap-2 text-sm text-slate-700 mt-0.5">
                      <Calendar size={14} className="text-slate-400" />
                      {formatDate(drawerCompany.memberSince)}
                    </div>
                  </div>
                )}
              </div>

              {/* Login info */}
              {drawerCompany.adminEmail && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wide flex items-center gap-1">
                        <Key size={12} /> Login do RH
                      </p>
                      <p className="text-sm text-blue-800 font-medium mt-0.5">{drawerCompany.adminEmail}</p>
                    </div>
                    <button
                      onClick={() => handleResetPassword(drawerCompany.id)}
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
                  <div className="bg-white border border-emerald-200 rounded-lg px-4 py-3 space-y-1">
                    <p className="text-xs text-slate-500">Login: <span className="font-bold text-slate-800">{resetResult.email}</span></p>
                    <p className="text-xs text-slate-500">Senha temporária: <span className="font-bold font-mono text-slate-800">{resetResult.tempPassword}</span></p>
                  </div>
                  <button
                    onClick={() => copyCredentials(resetResult.email, resetResult.tempPassword)}
                    className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy size={14} /> {copied ? 'Copiado!' : 'Copiar Credenciais'}
                  </button>
                  <p className="text-xs text-amber-700 font-medium">Anote a senha — ela não será exibida novamente.</p>
                </div>
              )}

              {/* Status */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Status</p>
                <span className={`inline-flex px-3 py-1.5 text-sm font-bold rounded-full ${drawerCompany.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {drawerCompany.status ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => openEdit(drawerCompany)}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-xl font-medium transition-colors"
                >
                  <Pencil size={16} /> Editar Empresa
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Import Modal ──────────────────────────────────────────────────── */}
      <Modal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Importar Empresas"
      >
        <div className="space-y-4">

          {/* Result screen */}
          {importResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <p className="text-sm font-bold text-emerald-800">Importação concluída!</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{importResult.created}</p>
                  <p className="text-xs text-emerald-600 font-medium">Criadas</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">{importResult.skipped}</p>
                  <p className="text-xs text-amber-600 font-medium">Ignoradas</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">{importResult.errors.length}</p>
                  <p className="text-xs text-red-600 font-medium">Erros</p>
                </div>
              </div>
              {importResult.skipped > 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                  Empresas ignoradas: CNPJ já existente no sistema.
                </p>
              )}
              {importResult.errors.length > 0 && (
                <div className="text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg max-h-32 overflow-y-auto space-y-1">
                  {importResult.errors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              )}
              <button
                onClick={() => { setImportModalOpen(false); setImportResult(null); setImportData([]); }}
                className="w-full bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-primary-dark transition-colors"
              >
                Fechar
              </button>
            </div>
          )}

          {/* Upload + Preview */}
          {!importResult && (
            <>
              {importData.length === 0 ? (
                <>
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <Upload size={36} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-700">Clique ou arraste o arquivo aqui</p>
                    <p className="text-xs text-slate-400 mt-1">Formatos aceitos: .xls, .xlsx</p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xls,.xlsx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                      e.target.value = '';
                    }}
                  />
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                    <strong>Colunas esperadas:</strong> Código Cliente, Proponente, Nome_Fantasia, CNPJ, Endereço, Bairro, Cep, Cidade, Estado, Inclusão
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                    <FileText size={16} />
                    <span><strong>{importData.length}</strong> empresas encontradas no arquivo</span>
                  </div>

                  {/* Preview table */}
                  <div className="max-h-60 overflow-auto rounded-xl border border-gray-100">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-slate-500 font-bold">Cód.</th>
                          <th className="px-3 py-2 text-left text-slate-500 font-bold">Razão Social</th>
                          <th className="px-3 py-2 text-left text-slate-500 font-bold">Nome Fantasia</th>
                          <th className="px-3 py-2 text-left text-slate-500 font-bold">CNPJ</th>
                          <th className="px-3 py-2 text-left text-slate-500 font-bold">Cidade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {importData.slice(0, 10).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 text-slate-600 font-mono">{row.externalCode}</td>
                            <td className="px-3 py-2 text-slate-700 font-medium max-w-[200px] truncate">{row.corporateName}</td>
                            <td className="px-3 py-2 text-slate-500 max-w-[150px] truncate">{row.tradeName}</td>
                            <td className="px-3 py-2 text-slate-500 font-mono">{displayCnpj(row.cnpj)}</td>
                            <td className="px-3 py-2 text-slate-500">{row.city}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importData.length > 10 && (
                      <p className="text-xs text-slate-400 text-center py-2">... e mais {importData.length - 10} empresas</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setImportData([])}
                      className="flex-1 border border-gray-200 text-slate-600 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={importing}
                      className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-2.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {importing ? 'Importando...' : `Importar ${importData.length} empresas`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* ── Create/Edit Modal ─────────────────────────────────────────────── */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setTempPassword(null); }} title={editingId ? 'Editar Empresa' : 'Nova Empresa'}>
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">

          {/* Credential screen */}
          {tempPassword && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <p className="text-sm font-bold text-emerald-800">Empresa criada com sucesso!</p>
              </div>
              <p className="text-xs text-emerald-700">Acesso do RH criado automaticamente. Compartilhe as credenciais abaixo:</p>
              <div className="bg-white border border-emerald-200 rounded-lg px-4 py-3 space-y-1">
                <p className="text-xs text-slate-500">Login: <span className="font-bold text-slate-800">{form.adminEmail}</span></p>
                <p className="text-xs text-slate-500">Senha temporária: <span className="font-bold font-mono text-slate-800">{tempPassword}</span></p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyCredentials(form.adminEmail, tempPassword)}
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

          {/* Form */}
          {!tempPassword && (
            <>
              {/* Section 1: Identification */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">1</div>
                  <h3 className="text-sm font-bold text-slate-700">Identificação</h3>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Razão Social / Proponente *</label>
                  <input
                    type="text"
                    value={form.corporateName}
                    onChange={(e) => setForm({ ...form, corporateName: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                    placeholder="Razão Social da Empresa LTDA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    value={form.tradeName}
                    onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                    placeholder="Nome Fantasia"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">CNPJ {!editingId ? '*' : ''}</label>
                    <input
                      type="text"
                      value={form.cnpj}
                      onChange={(e) => setForm({ ...form, cnpj: formatCnpj(e.target.value) })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 font-mono"
                      placeholder="00.000.000/0001-00"
                      maxLength={18}
                      disabled={!!editingId}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Código Cliente</label>
                    <p className="text-xs text-slate-400 mb-1">ID do sistema legado</p>
                    <input
                      type="text"
                      value={form.externalCode}
                      onChange={(e) => setForm({ ...form, externalCode: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                      placeholder="Ex: 5512"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Address */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">2</div>
                  <h3 className="text-sm font-bold text-slate-700">Endereço</h3>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Endereço completo</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                    placeholder="Rua, número, complemento"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Bairro</label>
                    <input
                      type="text"
                      value={form.neighborhood}
                      onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                      placeholder="Centro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">CEP</label>
                    <input
                      type="text"
                      value={form.zipCode}
                      onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Cidade</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                      placeholder="Videira"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Estado</label>
                    <select
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                    >
                      <option value="">Selecione</option>
                      {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Contact & Access */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">3</div>
                  <h3 className="text-sm font-bold text-slate-700">Contato e Acesso</h3>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">E-mail do RH / Responsável</label>
                  <p className="text-xs text-slate-400 mb-1.5">Será usado como login da empresa na plataforma</p>
                  <input
                    type="email"
                    value={form.adminEmail}
                    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                    placeholder="rh@empresa.com.br"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Telefone</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Membro desde</label>
                    <input
                      type="date"
                      value={form.memberSince}
                      onChange={(e) => setForm({ ...form, memberSince: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                    />
                  </div>
                </div>

                {!editingId && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                    <strong>Dica:</strong> Se informar um e-mail, o sistema criará automaticamente o login do RH com uma senha temporária.
                  </div>
                )}
              </div>

              {/* Section 4: Políticas da Empresa */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">4</div>
                  <h3 className="text-sm font-bold text-slate-700">Políticas da Empresa</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Pagamento de dependentes</label>
                    <p className="text-xs text-slate-400 mb-1.5">Quem arca com o custo de dependentes vinculados</p>
                    <select
                      value={form.dependentPaymentMode}
                      onChange={(e) => setForm({ ...form, dependentPaymentMode: e.target.value as 'titular' | 'empresa' })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                    >
                      <option value="titular">Titular paga</option>
                      <option value="empresa">Empresa paga</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Cartão padrão</label>
                    <p className="text-xs text-slate-400 mb-1.5">Aplicado a novos beneficiários por padrão</p>
                    <select
                      value={form.defaultCardType}
                      onChange={(e) => setForm({ ...form, defaultCardType: e.target.value as 'app' | 'physical' })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                    >
                      <option value="app">Somente aplicativo</option>
                      <option value="physical">Físico + aplicativo</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg flex items-center gap-2">
                  <AlertCircle size={15} /> {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setModalOpen(false); setTempPassword(null); }}
                  className="flex-1 border border-gray-200 text-slate-700 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Empresa'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
