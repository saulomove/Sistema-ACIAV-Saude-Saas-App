'use client';

import { useState, useRef } from 'react';
import {
  Settings, User, Lock, Clock, MessageCircle,
  Camera, Save, AlertCircle, CheckCircle, Info,
} from 'lucide-react';

interface Provider {
  id: string;
  name?: string | null;
  professionalName?: string | null;
  clinicName?: string | null;
  registration?: string | null;
  category?: string | null;
  specialty?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  bio?: string | null;
  businessHours?: string | null;
  photoUrl?: string | null;
}

type Msg = { type: 'ok' | 'error'; text: string } | null;

function whatsLink(raw: string | null | undefined, message: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/55${digits}?text=${encodeURIComponent(message)}`;
}

export default function ConfiguracoesClient({
  initialProvider,
  supportWhatsapp,
  apiBase,
}: {
  initialProvider: Provider;
  supportWhatsapp: string | null;
  apiBase: string;
}) {
  const [provider, setProvider] = useState<Provider>(initialProvider);
  const [form, setForm] = useState<Provider>(initialProvider);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<Msg>(null);

  // Foto
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<Msg>(null);

  // Senha
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<Msg>(null);

  const supportHref = whatsLink(
    supportWhatsapp,
    'Olá, sou credenciado ACIAV Saúde e gostaria de solicitar uma alteração na minha tabela de serviços.',
  );

  // ─── Foto ──────────────────────────────────────────────────────────────────
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setPhotoMsg(null);

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch(`${apiBase}/providers/me/photo`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhotoMsg({ type: 'error', text: data?.message || 'Falha no upload da foto.' });
      } else {
        setProvider((p) => ({ ...p, photoUrl: data.photoUrl }));
        setPhotoMsg({ type: 'ok', text: 'Foto atualizada com sucesso.' });
      }
    } catch {
      setPhotoMsg({ type: 'error', text: 'Erro de rede ao enviar foto.' });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ─── Perfil ────────────────────────────────────────────────────────────────
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    try {
      const res = await fetch(`${apiBase}/providers/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalName: form.professionalName ?? null,
          clinicName: form.clinicName ?? null,
          registration: form.registration ?? null,
          specialty: form.specialty ?? null,
          address: form.address ?? null,
          city: form.city ?? null,
          phone: form.phone ?? null,
          whatsapp: form.whatsapp ?? null,
          email: form.email ?? null,
          bio: form.bio ?? null,
          businessHours: form.businessHours ?? null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileMsg({ type: 'error', text: data?.message || 'Não foi possível salvar.' });
      } else {
        setProvider(data);
        setForm(data);
        setProfileMsg({ type: 'ok', text: 'Dados cadastrais atualizados.' });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Erro de rede ao salvar.' });
    } finally {
      setSavingProfile(false);
    }
  }

  // ─── Senha ─────────────────────────────────────────────────────────────────
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);

    if (!pwd.current || !pwd.next || !pwd.confirm) {
      setPwdMsg({ type: 'error', text: 'Preencha todos os campos.' });
      return;
    }
    if (pwd.next.length < 6) {
      setPwdMsg({ type: 'error', text: 'A nova senha precisa ter pelo menos 6 caracteres.' });
      return;
    }
    if (pwd.next !== pwd.confirm) {
      setPwdMsg({ type: 'error', text: 'A confirmação não confere com a nova senha.' });
      return;
    }

    setSavingPwd(true);
    try {
      const res = await fetch(`${apiBase}/auth/change-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwdMsg({ type: 'error', text: data?.message || 'Não foi possível alterar a senha.' });
      } else {
        setPwd({ current: '', next: '', confirm: '' });
        setPwdMsg({ type: 'ok', text: 'Senha alterada com sucesso.' });
      }
    } catch {
      setPwdMsg({ type: 'error', text: 'Erro de rede ao alterar senha.' });
    } finally {
      setSavingPwd(false);
    }
  }

  const inputCls =
    'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178]';
  const labelCls = 'block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="text-[#007178]" /> Configurações
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Atualize seus dados cadastrais, foto, horário de atendimento e senha.
        </p>
      </div>

      {/* ─── Foto ─────────────────────────────────────────────────────────── */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
          <Camera size={16} className="text-[#007178]" /> Foto / Logo
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
            {provider.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={provider.photoUrl} alt="Foto" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <User size={28} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              disabled={uploadingPhoto}
              className="block text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#007178] file:text-white hover:file:bg-[#005f66] file:cursor-pointer cursor-pointer"
            />
            <p className="text-xs text-slate-400 mt-1">JPG, PNG ou WebP. Máximo 2 MB.</p>
          </div>
        </div>
        {photoMsg && (
          <div
            className={`mt-3 flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${
              photoMsg.type === 'ok'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {photoMsg.type === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{photoMsg.text}</span>
          </div>
        )}
      </section>

      {/* ─── Dados cadastrais ────────────────────────────────────────────── */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
          <User size={16} className="text-[#007178]" /> Dados cadastrais
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nome profissional</label>
              <input
                type="text"
                className={inputCls}
                value={form.professionalName ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, professionalName: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>Nome da clínica</label>
              <input
                type="text"
                className={inputCls}
                value={form.clinicName ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, clinicName: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>Registro (CRM/CRO/CREFITO…)</label>
              <input
                type="text"
                className={inputCls}
                value={form.registration ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, registration: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>Especialidade</label>
              <input
                type="text"
                className={inputCls}
                value={form.specialty ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Endereço</label>
              <input
                type="text"
                className={inputCls}
                value={form.address ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>Cidade</label>
              <input
                type="text"
                className={inputCls}
                value={form.city ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>E-mail</label>
              <input
                type="email"
                className={inputCls}
                value={form.email ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>Telefone</label>
              <input
                type="text"
                className={inputCls}
                value={form.phone ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>WhatsApp</label>
              <input
                type="text"
                className={inputCls}
                value={form.whatsapp ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Biografia / descrição</label>
            <textarea
              rows={3}
              className={inputCls}
              value={form.bio ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            />
          </div>

          <div>
            <label className={labelCls}>
              <span className="inline-flex items-center gap-1">
                <Clock size={12} /> Horários de atendimento
              </span>
            </label>
            <textarea
              rows={4}
              placeholder={'Ex.:\nSegunda a sexta: 08h às 18h\nSábado: 08h às 12h'}
              className={inputCls}
              value={form.businessHours ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, businessHours: e.target.value }))}
            />
            <p className="text-xs text-slate-400 mt-1">
              Texto livre — aparece para os pacientes no Guia de Credenciados.
            </p>
          </div>

          {profileMsg && (
            <div
              className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${
                profileMsg.type === 'ok'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {profileMsg.type === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 bg-[#007178] hover:bg-[#005f66] disabled:bg-slate-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <Save size={16} /> {savingProfile ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </section>

      {/* ─── Senha ───────────────────────────────────────────────────────── */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
          <Lock size={16} className="text-[#007178]" /> Alterar senha
        </h2>

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Senha atual</label>
            <input
              type="password"
              autoComplete="current-password"
              className={inputCls}
              value={pwd.current}
              onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Nova senha</label>
            <input
              type="password"
              autoComplete="new-password"
              className={inputCls}
              value={pwd.next}
              onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Confirmar nova senha</label>
            <input
              type="password"
              autoComplete="new-password"
              className={inputCls}
              value={pwd.confirm}
              onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
            />
          </div>

          {pwdMsg && (
            <div
              className={`md:col-span-3 flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${
                pwdMsg.type === 'ok'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {pwdMsg.type === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{pwdMsg.text}</span>
            </div>
          )}

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={savingPwd}
              className="inline-flex items-center gap-2 bg-[#007178] hover:bg-[#005f66] disabled:bg-slate-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <Lock size={16} /> {savingPwd ? 'Alterando…' : 'Alterar senha'}
            </button>
          </div>
        </form>
      </section>

      {/* ─── Tabela de serviços (read-only) ─────────────────────────────── */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-amber-800 text-sm">
              Alterações na tabela de serviços
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Inclusão, edição e remoção de serviços da tabela são feitas pela administração da
              ACIAV Saúde. Envie a solicitação pelo WhatsApp — a mensagem já vai pronta.
            </p>
            {supportHref ? (
              <a
                href={supportHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
              >
                <MessageCircle size={16} /> Falar com a ACIAV
              </a>
            ) : (
              <p className="mt-2 text-xs text-amber-600">
                A administração entrará em contato através do canal habitual.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
