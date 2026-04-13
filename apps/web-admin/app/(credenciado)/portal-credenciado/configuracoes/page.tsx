'use client';

import { useState } from 'react';
import { Settings, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../../../lib/api-client';

export default function ConfiguracoesCredPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleChangePassword() {
    setError('');
    setSuccess('');

    if (!currentPassword.trim()) { setError('Informe a senha atual.'); return; }
    if (newPassword.length < 8) { setError('A nova senha deve ter no mínimo 8 caracteres.'); return; }
    if (!/\d/.test(newPassword)) { setError('A nova senha deve conter ao menos um número.'); return; }
    if (newPassword !== confirmPassword) { setError('A confirmação da senha não confere.'); return; }

    setSaving(true);
    try {
      await api.patch('/auth/change-password', { currentPassword, newPassword });
      setSuccess('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao alterar senha.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="text-[#007178]" /> Configurações
        </h1>
        <p className="text-slate-500 text-sm mt-1">Gerencie sua conta e preferências.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
        <h2 className="text-lg font-bold text-slate-800">Alterar Senha</h2>
        <p className="text-sm text-slate-500">
          Recomendamos trocar a senha temporária no primeiro acesso.
        </p>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Senha Atual *</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-11 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007178]/20 bg-slate-50"
              placeholder="Digite sua senha atual"
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Nova Senha *</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-11 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007178]/20 bg-slate-50"
              placeholder="Mínimo 8 caracteres com 1 número"
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirmar Nova Senha *</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007178]/20 bg-slate-50"
            placeholder="Repita a nova senha"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg">
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        <button
          onClick={handleChangePassword}
          disabled={saving}
          className="w-full bg-[#007178] hover:bg-[#005f64] text-white py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? 'Alterando...' : 'Alterar Senha'}
        </button>
      </div>
    </div>
  );
}
