'use client';

import { useState } from 'react';
import { Lock, Save, CheckCircle, LogOut, Shield, History } from 'lucide-react';
import Link from 'next/link';
import ConfirmDeleteDialog from '../../../../components/ConfirmDeleteDialog';

export interface SecuritySettings {
  passwordMinLength?: number;
  passwordRequireUppercase?: boolean;
  passwordRequireNumber?: boolean;
  passwordRequireSymbol?: boolean;
  passwordExpiryDays?: number;
  sessionTimeoutMinutes?: number;
  forceLogoutOnPasswordChange?: boolean;
  requireFirstAccessWizard?: boolean;
  passwordResetExpirationMinutes?: number;
  passwordResetNotifyEmail?: boolean;
  maxLoginAttempts?: number;
  lockoutMinutes?: number;
  auditLogRetentionDays?: number;
}

interface Props {
  unitId: string;
  initial: SecuritySettings;
  rawSettings: Record<string, unknown>;
}

const DEFAULTS: Required<SecuritySettings> = {
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumber: true,
  passwordRequireSymbol: false,
  passwordExpiryDays: 0,
  sessionTimeoutMinutes: 480,
  forceLogoutOnPasswordChange: true,
  requireFirstAccessWizard: true,
  passwordResetExpirationMinutes: 15,
  passwordResetNotifyEmail: true,
  maxLoginAttempts: 5,
  lockoutMinutes: 15,
  auditLogRetentionDays: 365,
};

export default function SecurityTab({ unitId, initial, rawSettings }: Props) {
  const [form, setForm] = useState<Required<SecuritySettings>>({ ...DEFAULTS, ...initial });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeBusy, setPurgeBusy] = useState(false);

  function set<K extends keyof Required<SecuritySettings>>(k: K, v: Required<SecuritySettings>[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    if (form.passwordMinLength < 6 || form.passwordMinLength > 32) {
      alert('Tamanho mínimo da senha deve estar entre 6 e 32.');
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      const merged = { ...rawSettings, security: form };
      const res = await fetch(`/internal/api/units/${unitId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: JSON.stringify(merged) }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmPurge() {
    setPurgeBusy(true);
    try {
      const res = await fetch(`/internal/api/units/${unitId}/sessions/purge`, { method: 'POST' });
      if (!res.ok) throw new Error();
      setPurgeOpen(false);
      alert('Sessões encerradas.');
    } catch {
      alert('Erro ao encerrar sessões.');
    } finally {
      setPurgeBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Lock className="text-primary" size={20} /> Política de Senha
          </h3>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-60"
          >
            {saved ? (<><CheckCircle size={16} /> Salvo!</>) : (<><Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}</>)}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Tamanho mínimo</label>
            <input
              type="number"
              min={6}
              max={32}
              value={form.passwordMinLength}
              onChange={(e) => set('passwordMinLength', Number(e.target.value) || 8)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Expira em</label>
            <select
              value={form.passwordExpiryDays}
              onChange={(e) => set('passwordExpiryDays', Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value={0}>Nunca</option>
              <option value={30}>30 dias</option>
              <option value={60}>60 dias</option>
              <option value={90}>90 dias</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.passwordRequireUppercase}
              onChange={(e) => set('passwordRequireUppercase', e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            Exigir letra maiúscula
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.passwordRequireNumber}
              onChange={(e) => set('passwordRequireNumber', e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            Exigir número
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.passwordRequireSymbol}
              onChange={(e) => set('passwordRequireSymbol', e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            Exigir caractere especial
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <Shield className="text-primary" size={20} /> Sessão
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Tempo de sessão</label>
            <select
              value={form.sessionTimeoutMinutes}
              onChange={(e) => set('sessionTimeoutMinutes', Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value={15}>15 minutos</option>
              <option value={60}>1 hora</option>
              <option value={240}>4 horas</option>
              <option value={480}>8 horas</option>
              <option value={1440}>24 horas</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 self-end mb-2">
            <input
              type="checkbox"
              checked={form.forceLogoutOnPasswordChange}
              onChange={(e) => set('forceLogoutOnPasswordChange', e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            Forçar logout ao trocar a senha
          </label>
        </div>

        <div className="border-t border-gray-100 mt-5 pt-5">
          <button
            onClick={() => setPurgeOpen(true)}
            className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-bold"
          >
            <LogOut size={16} /> Encerrar todas as sessões ativas agora
          </button>
          <p className="text-xs text-slate-500 mt-2">Força o logout de todos os usuários da unidade (exceto você).</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-slate-800 mb-4">Recuperação de Senha</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Token de reset expira em</label>
            <select
              value={form.passwordResetExpirationMinutes}
              onChange={(e) => set('passwordResetExpirationMinutes', Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>1 hora</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 self-end mb-2">
            <input
              type="checkbox"
              checked={form.passwordResetNotifyEmail}
              onChange={(e) => set('passwordResetNotifyEmail', e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            Notificar por e-mail após troca
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.requireFirstAccessWizard}
              onChange={(e) => set('requireFirstAccessWizard', e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            Exigir wizard no primeiro acesso
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-slate-800 mb-4">Tentativas e Bloqueio</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Máx. tentativas falhas</label>
            <select
              value={form.maxLoginAttempts}
              onChange={(e) => set('maxLoginAttempts', Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value={0}>Ilimitado</option>
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Tempo de bloqueio</label>
            <select
              value={form.lockoutMinutes}
              onChange={(e) => set('lockoutMinutes', Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value={5}>5 minutos</option>
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>1 hora</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <History className="text-primary" size={20} /> Retenção do Log de Auditoria
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Manter registros por</label>
            <select
              value={form.auditLogRetentionDays}
              onChange={(e) => set('auditLogRetentionDays', Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value={90}>90 dias</option>
              <option value={180}>180 dias</option>
              <option value={365}>1 ano</option>
              <option value={730}>2 anos</option>
            </select>
          </div>
          <div className="self-end">
            <Link href="/auditoria" className="text-sm text-primary font-bold hover:underline">Ver log de auditoria →</Link>
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={purgeOpen}
        title="Encerrar todas as sessões"
        description="Todos os usuários da unidade serão desconectados (exceto você). Esta ação não pode ser desfeita."
        busy={purgeBusy}
        confirmButtonLabel="Encerrar sessões"
        onConfirm={confirmPurge}
        onClose={() => setPurgeOpen(false)}
      />
    </div>
  );
}
