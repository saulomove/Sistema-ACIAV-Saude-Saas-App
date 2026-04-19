'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Plus, Search, Pencil, Trash2, FileSpreadsheet,
  Loader2, X, Phone, Key, Copy, CheckCircle2,
  ChevronRight, Upload, Calendar, FileText, UserCheck, UserMinus,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from '../../../components/Modal';
import ExportExcelButton from '../../../components/ExportExcelButton';
import { api } from '../../../lib/api-client';

interface Company {
  id: string;
  corporateName: string;
}

interface User {
  id: string;
  externalCode?: string | null;
  fullName: string;
  cpf: string;
  type: string;
  parentId?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  kinship?: string | null;
  billingName?: string | null;
  memberSince?: string | null;
  companyId?: string | null;
  cardTypeOverride?: 'app' | 'physical' | null;
  inactivationReason?: string | null;
  inactivatedAt?: string | null;
  inactivationLockUntil?: string | null;
  pointsBalance: number;
  status: boolean;
  company?: { corporateName: string } | null;
  parent?: { fullName: string } | null;
  _count?: { dependents: number; transactions: number };
}

interface ImportRow {
  externalCode: string;
  fullName: string;
  cpf: string;
  parentExternalCode: string;
  proponentName: string;
  billingName: string;
  gender: string;
  birthDate: string;
  kinship: string;
  phone: string;
  memberSince: string;
}

const EMPTY_FORM = {
  fullName: '', cpf: '', type: 'titular', companyId: '', parentId: '',
  externalCode: '', gender: '', birthDate: '', phone: '',
  kinship: '', billingName: '', memberSince: '',
  cardTypeOverride: '' as '' | 'app' | 'physical',
};

function formatCpf(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function displayCpf(cpf?: string | null) {
  if (!cpf) return '—';
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return formatCpf(d);
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
  } catch {
    return dateStr;
  }
}

function parseDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

function parseExcelDate(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
  }
  const str = String(value).trim();
  const parts = str.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return str;
}

const COLUMN_MAP: Record<string, keyof ImportRow> = {
  'proponente': 'proponentName',
  'código cliente': 'externalCode',
  'codigo cliente': 'externalCode',
  'cliente': 'fullName',
  'código titular': 'parentExternalCode',
  'codigo titular': 'parentExternalCode',
  'cliente cobrança': 'billingName',
  'cliente cobranca': 'billingName',
  'sexo': 'gender',
  'data nasc/data fundação': 'birthDate',
  'data nasc/data fundacao': 'birthDate',
  'data nasc': 'birthDate',
  'data nascimento': 'birthDate',
  'cpf': 'cpf',
  'parentesco': 'kinship',
  'telefone': 'phone',
  'inclusão': 'memberSince',
  'inclusao': 'memberSince',
};

function mapExcelRow(row: Record<string, unknown>): ImportRow {
  const mapped: Record<string, string> = {};
  for (const [excelKey, value] of Object.entries(row)) {
    const normalizedKey = excelKey.toLowerCase().trim();
    const systemKey = COLUMN_MAP[normalizedKey];
    if (systemKey) {
      if (systemKey === 'birthDate' || systemKey === 'memberSince') {
        mapped[systemKey] = parseExcelDate(value);
      } else {
        let strVal = String(value ?? '').trim();
        if (systemKey === 'externalCode' || systemKey === 'parentExternalCode') {
          strVal = strVal.replace(/\.0$/, '');
        }
        if (systemKey === 'cpf') {
          strVal = strVal.replace(/\D/g, '');
        }
        if (systemKey === 'phone') {
          strVal = strVal.replace(/\D/g, '');
        }
        mapped[systemKey] = strVal;
      }
    }
  }
  return mapped as unknown as ImportRow;
}

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

  const [drawerUser, setDrawerUser] = useState<User | null>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number; skipped: number; errors: string[]; loginsCreated: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetResult, setResetResult] = useState<{ tempPassword: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [inactivateTarget, setInactivateTarget] = useState<User | null>(null);
  const [inactivateReason, setInactivateReason] = useState('');
  const [inactivateError, setInactivateError] = useState('');
  const [inactivateSubmitting, setInactivateSubmitting] = useState(false);

  const [conflictInfo, setConflictInfo] = useState<{
    existingUserId: string;
    existingCompany: string | null;
    locked: boolean;
    lockUntil: string | null;
    message: string;
  } | null>(null);

  const companyList = companies as Company[];
  const userList = users as User[];
  const titulares = userList.filter((u) => u.type === 'titular' && u.status);

  const lista = userList.filter((u) => {
    const matchSearch =
      !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.cpf.includes(search.replace(/\D/g, '')) ||
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

  const totalTitulares = userList.filter((u) => u.type === 'titular').length;
  const totalDependentes = userList.filter((u) => u.type === 'dependente').length;
  const totalAtivos = userList.filter((u) => u.status).length;

  // ── Drawer ──────────────────────────────────────────────────────────────

  function openDrawer(u: User) {
    setDrawerUser(u);
    setResetResult(null);
  }

  function closeDrawer() {
    setDrawerUser(null);
    setResetResult(null);
  }

  function copyCredentials(email: string, password: string) {
    navigator.clipboard.writeText(`Login: ${email}\nSenha: ${password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleResetPassword(userId: string) {
    if (!confirm('Resetar a senha deste beneficiário? Todas as sessões ativas serão encerradas.')) return;
    setResettingPassword(true);
    setResetResult(null);
    try {
      const result = await api.post(`/auth/reset-password/user/${userId}`, {}) as { tempPassword: string; email: string };
      setResetResult(result);
    } catch {
      alert('Erro ao resetar senha. Verifique se o beneficiário possui login cadastrado.');
    } finally {
      setResettingPassword(false);
    }
  }

  // ── CRUD ────────────────────────────────────────────────────────────────

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }

  function openEdit(u: User, e?: React.MouseEvent) {
    e?.stopPropagation();
    setEditingId(u.id);
    setForm({
      fullName: u.fullName,
      cpf: u.cpf,
      type: u.type,
      companyId: u.companyId ?? '',
      parentId: u.parentId ?? '',
      externalCode: u.externalCode ?? '',
      gender: u.gender ?? '',
      birthDate: u.birthDate ? u.birthDate.slice(0, 10) : '',
      phone: u.phone ?? '',
      kinship: u.kinship ?? '',
      billingName: u.billingName ?? '',
      memberSince: u.memberSince ? u.memberSince.slice(0, 10) : '',
      cardTypeOverride: (u.cardTypeOverride ?? '') as '' | 'app' | 'physical',
    });
    setError('');
    setModalOpen(true);
  }

  async function submitUserPayload(
    editing: boolean,
    payload: Record<string, unknown>,
    confirmTransfer: boolean,
  ) {
    const qs = confirmTransfer ? '?confirmTransfer=true' : '';
    const url = editing
      ? `/internal/api/users/${editingId}${qs}`
      : `/internal/api/users${qs}`;
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  async function handleSave(confirmTransfer = false) {
    if (!form.fullName.trim() || !form.cpf.trim()) {
      setError('Nome e CPF são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        fullName: form.fullName.trim(),
        phone: form.phone.replace(/\D/g, '') || undefined,
        gender: form.gender || undefined,
        kinship: form.kinship || undefined,
        billingName: form.billingName.trim() || undefined,
        externalCode: form.externalCode.trim() || undefined,
        birthDate: form.birthDate || undefined,
        memberSince: form.memberSince || undefined,
        companyId: form.companyId || undefined,
        cardTypeOverride: form.cardTypeOverride === '' ? null : form.cardTypeOverride,
      };

      if (!editingId) {
        payload.unitId = unitId;
        payload.cpf = form.cpf.replace(/\D/g, '');
        payload.type = form.type;
        payload.parentId = form.parentId || undefined;
      }

      const result = await submitUserPayload(!!editingId, payload, confirmTransfer);
      if (!result.ok) {
        const body = (result.data?.message && typeof result.data.message === 'object')
          ? result.data.message
          : result.data;
        if (result.status === 409 && body?.conflict) {
          setConflictInfo({
            existingUserId: body.existingUserId,
            existingCompany: body.existingCompany?.corporateName || null,
            locked: !!body.locked,
            lockUntil: body.inactivationLockUntil || null,
            message: body.message || 'Conflito de cadastro.',
          });
          return;
        }
        setError(body?.message || `Erro ${result.status}`);
        return;
      }

      setModalOpen(false);
      setConflictInfo(null);
      if (editingId && drawerUser && drawerUser.id === editingId) {
        setDrawerUser({ ...drawerUser, ...payload } as User);
      }
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(u: User, e?: React.MouseEvent) {
    e?.stopPropagation();
    // Reativar direto; inativação passa pelo modal com motivo
    if (u.status) {
      openInactivate(u);
      return;
    }
    try {
      await api.post(`/users/${u.id}/reactivate`, {});
      startTransition(() => router.refresh());
    } catch (e2: unknown) {
      alert(e2 instanceof Error ? e2.message : 'Erro ao reativar.');
    }
  }

  function openInactivate(u: User, e?: React.MouseEvent) {
    e?.stopPropagation();
    setInactivateTarget(u);
    setInactivateReason('');
    setInactivateError('');
  }

  async function handleInactivateSubmit() {
    if (!inactivateTarget) return;
    const reason = inactivateReason.trim();
    if (reason.length < 3) {
      setInactivateError('Motivo obrigatório (mínimo 3 caracteres).');
      return;
    }
    setInactivateSubmitting(true);
    setInactivateError('');
    try {
      const res = await fetch(`/internal/api/users/${inactivateTarget.id}/inactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInactivateError(data.message || 'Erro ao inativar.');
        return;
      }
      setInactivateTarget(null);
      setInactivateReason('');
      startTransition(() => router.refresh());
    } catch {
      setInactivateError('Erro de conexão.');
    } finally {
      setInactivateSubmitting(false);
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
        const mapped = json.map(mapExcelRow).filter((r) => r.cpf && r.fullName);
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
        birthDate: row.birthDate ? parseDateBR(row.birthDate) : undefined,
        memberSince: row.memberSince ? parseDateBR(row.memberSince) : undefined,
      }));
      const result = await api.post('/users/import', { users: payload }) as {
        created: number; skipped: number; errors: string[]; loginsCreated: number;
      };
      setImportResult(result);
      startTransition(() => router.refresh());
    } catch {
      alert('Erro ao importar beneficiários.');
    } finally {
      setImporting(false);
    }
  }

  const importTitulares = importData.filter((r) => !r.parentExternalCode);
  const importDependentes = importData.filter((r) => !!r.parentExternalCode);

  // ── Render ──────────────────────────────────────────────────────────────

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
        <div className="flex items-center gap-3 flex-wrap">
          <ExportExcelButton endpoint="users" />
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
            <Plus size={16} /> Novo Beneficiário
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Total</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{userList.length.toLocaleString('pt-BR')}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Titulares</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{totalTitulares.toLocaleString('pt-BR')}</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <UserCheck size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Dependentes</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{totalDependentes.toLocaleString('pt-BR')}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
            <UserMinus size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Ativos</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{totalAtivos.toLocaleString('pt-BR')}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>
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
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">CPF</th>
                  <th className="px-6 py-4">Sexo</th>
                  <th className="px-6 py-4">Vínculo</th>
                  <th className="px-6 py-4">Dep.</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lista.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => openDrawer(u)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-800 group-hover:text-primary transition-colors">
                          {u.fullName}
                        </span>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-xs text-slate-400 mt-0.5 block">{u.company?.corporateName ?? '—'}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{displayCpf(u.cpf)}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{u.gender || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md border ${u.type === 'titular' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {u.type === 'titular' ? 'Titular' : 'Dependente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-slate-700 font-semibold text-xs border border-slate-200">
                        {u._count?.dependents ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => handleToggleStatus(u, e)}
                        className={`inline-flex px-2 py-1 text-xs font-bold rounded-full cursor-pointer hover:opacity-75 transition-opacity ${u.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {u.status ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => openEdit(u, e)}
                          className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={17} />
                        </button>
                        {u.status && (
                          <button
                            onClick={(e) => openInactivate(u, e)}
                            className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Inativar com motivo"
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
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
      {drawerUser && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="fixed right-0 top-0 h-full w-full max-w-xl z-50 bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">

            {/* Drawer header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${drawerUser.type === 'titular' ? 'bg-primary/10 text-primary' : 'bg-amber-50 text-amber-600'}`}>
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-lg leading-tight">{drawerUser.fullName}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {drawerUser.type === 'titular' ? 'Titular' : 'Dependente'}
                    {drawerUser.company?.corporateName ? ` — ${drawerUser.company.corporateName}` : ''}
                  </p>
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
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-medium mb-1">Dependentes</p>
                  <p className="font-bold text-xl text-slate-800">{drawerUser._count?.dependents ?? 0}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-medium mb-1">Transações</p>
                  <p className="font-bold text-xl text-slate-800">{drawerUser._count?.transactions ?? 0}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-medium mb-1">Código</p>
                  <p className="font-bold text-xl text-slate-800">{drawerUser.externalCode || '—'}</p>
                </div>
              </div>

              {/* Info cards */}
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">CPF</p>
                  <p className="text-sm text-slate-700 font-mono mt-0.5">{displayCpf(drawerUser.cpf)}</p>
                </div>

                {drawerUser.gender && (
                  <div className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Sexo</p>
                    <p className="text-sm text-slate-700 mt-0.5">
                      {drawerUser.gender === 'M' ? 'Masculino' : drawerUser.gender === 'F' ? 'Feminino' : drawerUser.gender}
                    </p>
                  </div>
                )}

                {drawerUser.birthDate && (
                  <div className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Data de Nascimento</p>
                    <div className="flex items-center gap-2 text-sm text-slate-700 mt-0.5">
                      <Calendar size={14} className="text-slate-400" />
                      {formatDate(drawerUser.birthDate)}
                    </div>
                  </div>
                )}

                {drawerUser.phone && (
                  <div className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Telefone</p>
                    <div className="flex items-center gap-2 text-sm text-slate-700 mt-0.5">
                      <Phone size={14} className="text-slate-400" />
                      {formatPhone(drawerUser.phone)}
                    </div>
                  </div>
                )}

                {drawerUser.kinship && (
                  <div className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Parentesco</p>
                    <p className="text-sm text-slate-700 mt-0.5">{drawerUser.kinship}</p>
                  </div>
                )}

                {drawerUser.billingName && (
                  <div className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Nome Cobrança</p>
                    <p className="text-sm text-slate-700 mt-0.5">{drawerUser.billingName}</p>
                  </div>
                )}

                {drawerUser.parent && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">Titular Responsável</p>
                    <p className="text-sm text-blue-800 font-medium mt-0.5">{drawerUser.parent.fullName}</p>
                  </div>
                )}

                {drawerUser.memberSince && (
                  <div className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Membro desde</p>
                    <div className="flex items-center gap-2 text-sm text-slate-700 mt-0.5">
                      <Calendar size={14} className="text-slate-400" />
                      {formatDate(drawerUser.memberSince)}
                    </div>
                  </div>
                )}
              </div>

              {/* Login info / Reset password */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wide flex items-center gap-1">
                      <Key size={12} /> Login do Paciente
                    </p>
                    <p className="text-sm text-blue-800 font-medium font-mono mt-0.5">{drawerUser.cpf}</p>
                  </div>
                  <button
                    onClick={() => handleResetPassword(drawerUser.id)}
                    disabled={resettingPassword}
                    className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {resettingPassword ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
                    {resettingPassword ? 'Resetando...' : 'Resetar Senha'}
                  </button>
                </div>
              </div>

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
                <span className={`inline-flex px-3 py-1.5 text-sm font-bold rounded-full ${drawerUser.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {drawerUser.status ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => openEdit(drawerUser)}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-xl font-medium transition-colors"
                >
                  <Pencil size={16} /> Editar Beneficiário
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
        title="Importar Beneficiários"
      >
        <div className="space-y-4">

          {/* Result screen */}
          {importResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <p className="text-sm font-bold text-emerald-800">Importação concluída!</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{importResult.created}</p>
                  <p className="text-xs text-emerald-600 font-medium">Criados</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">{importResult.skipped}</p>
                  <p className="text-xs text-amber-600 font-medium">Ignorados</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{importResult.loginsCreated}</p>
                  <p className="text-xs text-blue-600 font-medium">Logins criados</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">{importResult.errors.length}</p>
                  <p className="text-xs text-red-600 font-medium">Erros</p>
                </div>
              </div>
              {importResult.skipped > 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                  Beneficiários ignorados: CPF já existente nesta unidade.
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
                    <strong>Colunas esperadas:</strong> Proponente, Código Cliente, Cliente, Código Titular, Cliente Cobrança, Sexo, Data Nasc, CPF, Parentesco, Telefone, Inclusão
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                    <FileText size={16} />
                    <span>
                      <strong>{importData.length}</strong> beneficiários encontrados
                      ({importTitulares.length} titulares + {importDependentes.length} dependentes)
                    </span>
                  </div>

                  {/* Preview table */}
                  <div className="max-h-60 overflow-auto rounded-xl border border-gray-100">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-slate-500 font-bold">Cód.</th>
                          <th className="px-3 py-2 text-left text-slate-500 font-bold">Nome</th>
                          <th className="px-3 py-2 text-left text-slate-500 font-bold">CPF</th>
                          <th className="px-3 py-2 text-left text-slate-500 font-bold">Tipo</th>
                          <th className="px-3 py-2 text-left text-slate-500 font-bold">Empresa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {importData.slice(0, 15).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 text-slate-600 font-mono">{row.externalCode}</td>
                            <td className="px-3 py-2 text-slate-700 font-medium max-w-[180px] truncate">{row.fullName}</td>
                            <td className="px-3 py-2 text-slate-500 font-mono">{displayCpf(row.cpf)}</td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.parentExternalCode ? 'bg-slate-100 text-slate-600' : 'bg-primary/10 text-primary'}`}>
                                {row.parentExternalCode ? 'DEP' : 'TIT'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-500 max-w-[120px] truncate">{row.proponentName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importData.length > 15 && (
                      <p className="text-xs text-slate-400 text-center py-2">... e mais {importData.length - 15} beneficiários</p>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 space-y-1">
                    <p>Login e senha de cada beneficiário serão criados automaticamente com o CPF.</p>
                    <p>Titulares são importados primeiro, depois dependentes são vinculados pelo Código Titular.</p>
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
                      {importing ? 'Importando...' : `Importar ${importData.length} beneficiários`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* ── Create/Edit Modal ─────────────────────────────────────────────── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Beneficiário' : 'Novo Beneficiário'}>
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">

          {/* Section 1: Identification */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">1</div>
              <h3 className="text-sm font-bold text-slate-700">Identificação</h3>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo *</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                placeholder="Nome completo do beneficiário"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">CPF *</label>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: formatCpf(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 font-mono"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Código Cliente</label>
                <input
                  type="text"
                  value={form.externalCode}
                  onChange={(e) => setForm({ ...form, externalCode: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                  placeholder="Ex: 5512"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Sexo</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                >
                  <option value="">Não informado</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="N">Não binário</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Vínculo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">2</div>
              <h3 className="text-sm font-bold text-slate-700">Vínculo</h3>
            </div>

            {!editingId && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tipo *</label>
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
                <label className="block text-sm font-bold text-slate-700 mb-1">Titular Responsável</label>
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

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Parentesco</label>
              <select
                value={form.kinship}
                onChange={(e) => setForm({ ...form, kinship: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
              >
                <option value="">Nenhum</option>
                <option value="AGREGADO">Agregado</option>
                <option value="CÔNJUGE">Cônjuge</option>
                <option value="FILHO/FILHA">Filho(a)</option>
                <option value="PAI/MÃE">Pai/Mãe</option>
                <option value="OUTROS">Outros</option>
              </select>
            </div>

            {companyList.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Empresa</label>
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
          </div>

          {/* Section 3: Contato */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">3</div>
              <h3 className="text-sm font-bold text-slate-700">Contato</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome Cobrança</label>
                <input
                  type="text"
                  value={form.billingName}
                  onChange={(e) => setForm({ ...form, billingName: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                  placeholder="Nome para cobrança"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Data de Inclusão</label>
              <input
                type="date"
                value={form.memberSince}
                onChange={(e) => setForm({ ...form, memberSince: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Cartão</label>
              <p className="text-xs text-slate-400 mb-1.5">Sobrescreve o padrão da empresa. Deixe em branco para herdar.</p>
              <select
                value={form.cardTypeOverride}
                onChange={(e) => setForm({ ...form, cardTypeOverride: e.target.value as '' | 'app' | 'physical' })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
              >
                <option value="">Herdar da empresa</option>
                <option value="app">Somente aplicativo</option>
                <option value="physical">Físico + aplicativo</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg">{error}</p>
          )}

          {!editingId && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
              O login e senha do beneficiário serão criados automaticamente com o CPF.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 border border-gray-200 text-slate-700 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex-1 bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar'}
            </button>
          </div>
        </div>
      </Modal>

      {inactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Inativar beneficiário</h3>
              <button
                onClick={() => { setInactivateTarget(null); setInactivateReason(''); setInactivateError(''); }}
                className="text-slate-400 hover:text-slate-600"
              >
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
                  value={inactivateReason}
                  onChange={(e) => setInactivateReason(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
                  placeholder="Ex.: desligamento em 01/04/2026"
                />
              </div>
              {inactivateError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{inactivateError}</div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setInactivateTarget(null); setInactivateReason(''); setInactivateError(''); }}
                  disabled={inactivateSubmitting}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleInactivateSubmit}
                  disabled={inactivateSubmitting || inactivateReason.trim().length < 3}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-lg text-sm"
                >
                  {inactivateSubmitting && <Loader2 size={14} className="animate-spin" />}
                  Confirmar inativação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {conflictInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {conflictInfo.locked ? 'Transferência bloqueada' : 'CPF já cadastrado em outra empresa'}
              </h3>
              <button onClick={() => setConflictInfo(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 text-sm text-slate-600">
              <p>
                {conflictInfo.existingCompany
                  ? <>Este CPF já pertence a <strong>{conflictInfo.existingCompany}</strong>.</>
                  : <>{conflictInfo.message}</>}
              </p>
              {conflictInfo.locked && conflictInfo.lockUntil && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2 rounded-lg">
                  Este beneficiário foi inativado recentemente e está bloqueado para nova empresa até{' '}
                  <strong>{formatDate(conflictInfo.lockUntil)}</strong>.
                </div>
              )}
              {!conflictInfo.locked && (
                <p>Deseja transferir o beneficiário para a empresa atual? O histórico de transações é preservado.</p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setConflictInfo(null)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                {!conflictInfo.locked && (
                  <button
                    onClick={() => { setConflictInfo(null); handleSave(true); }}
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-bold px-4 py-2 rounded-lg text-sm"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    Transferir para esta empresa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
