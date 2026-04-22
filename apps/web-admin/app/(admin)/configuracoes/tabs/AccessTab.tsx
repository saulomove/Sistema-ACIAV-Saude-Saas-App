'use client';

import { useEffect, useState } from 'react';
import { UserCog, UserPlus, Mail, Shield, KeyRound, Ban, CheckCircle2, Copy } from 'lucide-react';
import ConfirmDeleteDialog from '../../../../components/ConfirmDeleteDialog';

interface AuthUserItem {
  id: string;
  email: string;
  role: string;
  status: boolean;
  name?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
}

interface RoleCounts {
  admin_unit: number;
  rh: number;
  provider: number;
  patient: number;
  super_admin: number;
}

interface Props {
  unitId: string;
  currentAuthUserId: string;
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin_unit: 'Admin da Unidade',
  rh: 'RH / Empresa',
  provider: 'Credenciado',
  patient: 'Paciente',
};

const ROLE_MATRIX: Array<{ role: string; panel: string; can: string }> = [
  { role: 'super_admin', panel: 'Gestão', can: 'Tudo, multi-unidade' },
  { role: 'admin_unit', panel: 'Gestão', can: 'Tudo dentro da unidade' },
  { role: 'rh', panel: 'Portal RH', can: 'Ver e gerenciar empresa, dependentes, inativar' },
  { role: 'provider', panel: 'Portal Credenciado', can: 'Consultar (read-only)' },
  { role: 'patient', panel: 'Portal Paciente', can: 'Ver economia, guia, resgatar' },
];

export default function AccessTab({ unitId, currentAuthUserId }: Props) {
  const [admins, setAdmins] = useState<AuthUserItem[]>([]);
  const [counts, setCounts] = useState<RoleCounts>({ admin_unit: 0, rh: 0, provider: 0, patient: 0, super_admin: 0 });
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'admin_unit' });
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ email: string; tempPassword: string } | null>(null);

  const [roleTarget, setRoleTarget] = useState<AuthUserItem | null>(null);
  const [resetTarget, setResetTarget] = useState<AuthUserItem | null>(null);
  const [statusTarget, setStatusTarget] = useState<AuthUserItem | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [resetResult, setResetResult] = useState<{ email: string; tempPassword: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [adminsRes, countsRes] = await Promise.all([
        fetch(`/internal/api/auth-users?unitId=${unitId}&role=admin_unit`),
        fetch(`/internal/api/auth-users/counts?unitId=${unitId}`),
      ]);
      if (adminsRes.ok) {
        const data = await adminsRes.json();
        setAdmins(Array.isArray(data) ? data : data?.data ?? []);
      }
      if (countsRes.ok) {
        const data = await countsRes.json();
        setCounts({ admin_unit: 0, rh: 0, provider: 0, patient: 0, super_admin: 0, ...data });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [unitId]);

  async function handleInvite() {
    if (!inviteForm.email || !inviteForm.name) {
      alert('Preencha nome e e-mail.');
      return;
    }
    setInviteBusy(true);
    try {
      const res = await fetch('/internal/api/auth-users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inviteForm, unitId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Erro ao convidar');
      }
      const data = await res.json();
      setInviteResult({ email: inviteForm.email, tempPassword: data.tempPassword ?? '' });
      setInviteForm({ email: '', name: '', role: 'admin_unit' });
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setInviteBusy(false);
    }
  }

  async function confirmRoleChange() {
    if (!roleTarget) return;
    setActionBusy(true);
    try {
      const newRole = roleTarget.role === 'admin_unit' ? 'super_admin' : 'admin_unit';
      const res = await fetch(`/internal/api/auth-users/${roleTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Erro');
      setRoleTarget(null);
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActionBusy(false);
    }
  }

  async function confirmResetPassword() {
    if (!resetTarget) return;
    setActionBusy(true);
    try {
      const res = await fetch(`/internal/api/auth-users/${resetTarget.id}/reset-password`, { method: 'POST' });
      if (!res.ok) throw new Error('Erro ao resetar senha');
      const data = await res.json();
      setResetResult({ email: resetTarget.email, tempPassword: data.tempPassword ?? '' });
      setResetTarget(null);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActionBusy(false);
    }
  }

  async function confirmStatusToggle() {
    if (!statusTarget) return;
    setActionBusy(true);
    try {
      const res = await fetch(`/internal/api/auth-users/${statusTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: !statusTarget.status }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Erro');
      setStatusTarget(null);
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActionBusy(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text);
  }

  return (
    <div className="space-y-6">
      {/* Contadores por papel */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <Shield className="text-primary" size={20} /> Usuários por Papel
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['admin_unit', 'rh', 'provider', 'patient'] as const).map((r) => (
            <div key={r} className="rounded-xl border border-gray-100 bg-slate-50 p-4">
              <div className="text-xs font-bold text-slate-500 uppercase">{ROLE_LABEL[r]}</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{counts[r] ?? 0}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Admins */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <UserCog className="text-primary" size={20} /> Administradores da Unidade
          </h3>
          <button
            onClick={() => { setInviteResult(null); setInviteOpen(true); }}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <UserPlus size={16} /> Convidar Admin
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Carregando...</div>
        ) : admins.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">Nenhum administrador cadastrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-xs text-slate-500 uppercase">
                <th className="text-left px-4 py-2 font-bold">Nome</th>
                <th className="text-left px-4 py-2 font-bold">E-mail</th>
                <th className="text-left px-4 py-2 font-bold">Papel</th>
                <th className="text-left px-4 py-2 font-bold">Status</th>
                <th className="text-right px-4 py-2 font-bold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {admins.map((u) => {
                const isSelf = u.id === currentAuthUserId;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-700">{u.name || '—'}{isSelf && <span className="ml-2 text-xs text-primary font-bold">(você)</span>}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">{ROLE_LABEL[u.role] || u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.status ? (
                        <span className="text-emerald-600 text-xs font-bold">Ativo</span>
                      ) : (
                        <span className="text-slate-400 text-xs font-bold">Inativo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => setResetTarget(u)}
                        disabled={isSelf}
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:bg-amber-50 px-2 py-1 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Resetar senha"
                      >
                        <KeyRound size={14} /> Reset
                      </button>
                      <button
                        onClick={() => setStatusTarget(u)}
                        disabled={isSelf}
                        className="inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:bg-red-50 px-2 py-1 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                        title={u.status ? 'Inativar' : 'Ativar'}
                      >
                        {u.status ? <><Ban size={14} /> Inativar</> : <><CheckCircle2 size={14} /> Ativar</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Matriz de Papéis */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-slate-800 mb-4">Matriz de Papéis (informativa)</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-100 text-xs text-slate-500 uppercase">
              <th className="text-left px-4 py-2 font-bold">Papel</th>
              <th className="text-left px-4 py-2 font-bold">Painel</th>
              <th className="text-left px-4 py-2 font-bold">Pode</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ROLE_MATRIX.map((r) => (
              <tr key={r.role}>
                <td className="px-4 py-3 font-bold text-slate-700">{ROLE_LABEL[r.role]}</td>
                <td className="px-4 py-3 text-slate-600">{r.panel}</td>
                <td className="px-4 py-3 text-slate-500">{r.can}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-slate-400 mt-3">Os papéis são definidos no sistema. Para personalização, entre em contato com o suporte.</p>
      </div>

      {/* Modal Convite */}
      {inviteOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <UserPlus className="text-primary" size={20} /> Convidar Administrador
            </h3>

            {inviteResult ? (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-sm text-emerald-800">
                  <Mail size={16} className="inline mr-1" /> E-mail de boas-vindas enviado para <strong>{inviteResult.email}</strong>.
                </div>
                {inviteResult.tempPassword && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 space-y-2">
                    <p className="text-xs font-bold text-amber-700">Senha temporária (mostrada apenas uma vez):</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white border border-amber-200 rounded px-3 py-2 text-sm font-mono">{inviteResult.tempPassword}</code>
                      <button onClick={() => copy(inviteResult.tempPassword)} className="text-amber-700 hover:bg-amber-100 p-2 rounded" title="Copiar">
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <button onClick={() => { setInviteOpen(false); setInviteResult(null); }} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold">Fechar</button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nome</label>
                  <input
                    type="text"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Papel</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="admin_unit">Admin da Unidade</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setInviteOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button
                    onClick={handleInvite}
                    disabled={inviteBusy}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-60"
                  >
                    {inviteBusy ? 'Enviando...' : 'Enviar Convite'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Reset Password Result */}
      {resetResult && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <KeyRound className="text-amber-600" size={20} /> Senha resetada
            </h3>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-sm text-emerald-800">
              <Mail size={16} className="inline mr-1" /> E-mail enviado para <strong>{resetResult.email}</strong>.
            </div>
            {resetResult.tempPassword && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 space-y-2">
                <p className="text-xs font-bold text-amber-700">Senha temporária (mostrada apenas uma vez):</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border border-amber-200 rounded px-3 py-2 text-sm font-mono">{resetResult.tempPassword}</code>
                  <button onClick={() => copy(resetResult.tempPassword)} className="text-amber-700 hover:bg-amber-100 p-2 rounded" title="Copiar">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={() => setResetResult(null)} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold">Fechar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!resetTarget}
        title="Resetar senha do administrador"
        description={resetTarget ? `Gerar nova senha temporária para ${resetTarget.email}. Um e-mail será enviado.` : ''}
        busy={actionBusy}
        confirmButtonLabel="Resetar senha"
        onConfirm={confirmResetPassword}
        onClose={() => setResetTarget(null)}
      />

      <ConfirmDeleteDialog
        open={!!statusTarget}
        title={statusTarget?.status ? 'Inativar administrador' : 'Ativar administrador'}
        description={statusTarget ? `${statusTarget.status ? 'Inativar' : 'Ativar'} ${statusTarget.email}?` : ''}
        busy={actionBusy}
        confirmButtonLabel={statusTarget?.status ? 'Inativar' : 'Ativar'}
        onConfirm={confirmStatusToggle}
        onClose={() => setStatusTarget(null)}
      />

      <ConfirmDeleteDialog
        open={!!roleTarget}
        title="Alterar papel"
        description={roleTarget ? `Trocar papel de ${roleTarget.email}?` : ''}
        busy={actionBusy}
        confirmButtonLabel="Alterar"
        onConfirm={confirmRoleChange}
        onClose={() => setRoleTarget(null)}
      />
    </div>
  );
}
