'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Smartphone, Bell, EyeOff, Calendar, Download, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../../../lib/api-client';

interface MeResponse {
  id: string;
  fullName: string;
  cpf: string;
  email: string | null;
  whatsapp: string | null;
  phone: string | null;
  birthDate: string | null;
  gender: string | null;
  photoUrl: string | null;
  company: { corporateName: string } | null;
  settings: {
    notifications: { email: boolean; whatsapp: boolean; newProviders: boolean };
  };
}

type TabKey = 'dados' | 'senha' | 'notificacoes' | 'privacidade';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

function formatCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatWhats(raw: string | null | undefined): string {
  if (!raw) return '';
  const d = raw.replace(/\D/g, '');
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return raw;
}

function toInputDate(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export default function ConfiguracoesPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('dados');
  const [savingDados, setSavingDados] = useState(false);
  const [savingSenha, setSavingSenha] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWhats, setNotifWhats] = useState(true);
  const [notifNewProviders, setNotifNewProviders] = useState(true);

  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = (await api.get('/portal-paciente/me')) as MeResponse;
        if (cancelled) return;
        setMe(data);
        setFullName(data.fullName);
        setWhatsapp(formatWhats(data.whatsapp));
        setEmail(data.email ?? '');
        setBirthDate(toInputDate(data.birthDate));
        setNotifEmail(data.settings.notifications.email);
        setNotifWhats(data.settings.notifications.whatsapp);
        setNotifNewProviders(data.settings.notifications.newProviders);
      } catch (err) {
        setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Erro ao carregar dados.' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 5000);
    return () => clearTimeout(t);
  }, [msg]);

  async function handleSaveDados(e: React.FormEvent) {
    e.preventDefault();
    setSavingDados(true);
    setMsg(null);
    try {
      await api.patch('/portal-paciente/me', {
        fullName,
        whatsapp: whatsapp.replace(/\D/g, ''),
        email: email.trim().toLowerCase(),
        birthDate: birthDate || undefined,
      });
      const refreshed = (await api.get('/portal-paciente/me')) as MeResponse;
      setMe(refreshed);
      setMsg({ kind: 'success', text: 'Dados salvos com sucesso.' });
    } catch (err) {
      setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Erro ao salvar.' });
    } finally {
      setSavingDados(false);
    }
  }

  async function handleSaveSenha(e: React.FormEvent) {
    e.preventDefault();
    setSavingSenha(true);
    setMsg(null);
    try {
      if (newPassword !== confirmPassword) {
        throw new Error('A confirmação não confere com a nova senha.');
      }
      if (newPassword.length < 8 || !/\d/.test(newPassword)) {
        throw new Error('A nova senha deve ter no mínimo 8 caracteres e conter ao menos um número.');
      }
      await api.post('/portal-paciente/me/password', {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMsg({ kind: 'success', text: 'Senha alterada. Entre novamente para continuar.' });
      setTimeout(() => { window.location.href = '/login'; }, 1500);
    } catch (err) {
      setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Erro ao alterar senha.' });
    } finally {
      setSavingSenha(false);
    }
  }

  async function handleSaveNotif() {
    setSavingNotif(true);
    setMsg(null);
    try {
      await api.patch('/portal-paciente/me/notifications', {
        email: notifEmail,
        whatsapp: notifWhats,
        newProviders: notifNewProviders,
      });
      setMsg({ kind: 'success', text: 'Preferências atualizadas.' });
    } catch (err) {
      setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Erro ao salvar preferências.' });
    } finally {
      setSavingNotif(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setMsg(null);
    try {
      const res = await fetch('/internal/download/portal-paciente/me/export');
      if (!res.ok) throw new Error('Falha ao exportar.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `meus-dados-${stamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg({ kind: 'success', text: 'Exportação iniciada.' });
    } catch (err) {
      setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Erro ao exportar.' });
    } finally {
      setExporting(false);
    }
  }

  async function handleRequestDeletion() {
    if (deleteConfirm !== 'CONFIRMAR') {
      setMsg({ kind: 'error', text: 'Digite CONFIRMAR para prosseguir.' });
      return;
    }
    if (deleteReason.trim().length < 5) {
      setMsg({ kind: 'error', text: 'Informe o motivo (mínimo 5 caracteres).' });
      return;
    }
    setDeleting(true);
    setMsg(null);
    try {
      const qs = new URLSearchParams({ reason: deleteReason }).toString();
      const res = await fetch(`/internal/api/portal-paciente/me?${qs}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { message?: string }).message || 'Erro ao solicitar.');
      setDeleteReason('');
      setDeleteConfirm('');
      setMsg({ kind: 'success', text: 'Solicitação enviada. A administração entrará em contato.' });
    } catch (err) {
      setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Erro ao solicitar exclusão.' });
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="animate-spin mr-3" size={20} /> Carregando...
      </div>
    );
  }
  if (!me) {
    return <div className="text-center text-slate-500 py-12">Não foi possível carregar seus dados.</div>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  };

  const tabs: Array<{ key: TabKey; label: string; icon: typeof User }> = [
    { key: 'dados', label: 'Dados Pessoais', icon: User },
    { key: 'senha', label: 'Senha e Segurança', icon: Lock },
    { key: 'notificacoes', label: 'Notificações', icon: Bell },
    { key: 'privacidade', label: 'Privacidade (LGPD)', icon: EyeOff },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-8"
    >
      <motion.div variants={itemVariants} className="pb-6 border-b border-gray-100">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Configurações da Conta</h1>
        <p className="text-slate-500 mt-2 font-medium">Gerencie seus dados pessoais, senha e preferências do aplicativo.</p>
      </motion.div>

      {msg && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            msg.kind === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {msg.kind === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="md:col-span-1 space-y-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={
                  active
                    ? 'w-full flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary border border-primary/20 font-bold rounded-xl transition-colors text-left'
                    : 'w-full flex items-center gap-3 px-4 py-3 text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors text-left'
                }
              >
                <Icon size={18} /> {t.label}
              </button>
            );
          })}
        </motion.div>

        <motion.div variants={itemVariants} className="md:col-span-2 space-y-6">
          {tab === 'dados' && (
            <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="flex items-center gap-6 mb-8 relative z-10">
                <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-black shadow-lg shadow-primary/30">
                  {initialsOf(me.fullName)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{me.fullName}</h3>
                  <p className="text-sm text-slate-500 font-medium font-mono mt-1">CPF: {formatCpf(me.cpf)}</p>
                  {me.company && (
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{me.company.corporateName}</p>
                  )}
                </div>
              </div>

              <form className="space-y-5 relative z-10" onSubmit={handleSaveDados}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Celular / WhatsApp</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">E-mail Principal</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Data de Nascimento</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    type="submit"
                    disabled={savingDados}
                    className="bg-primary hover:bg-primary-dark disabled:opacity-60 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    {savingDados && <Loader2 size={16} className="animate-spin" />}
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          )}

          {tab === 'senha' && (
            <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
              <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Lock size={20} className="text-primary" /> Alterar Senha
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                A nova senha deve ter no mínimo 8 caracteres e conter ao menos um número. Ao alterar, você será deslogado de todos os dispositivos.
              </p>
              <form className="space-y-5" onSubmit={handleSaveSenha}>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Senha atual</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Nova senha</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Confirmar nova senha</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSenha}
                    className="bg-primary hover:bg-primary-dark disabled:opacity-60 text-white px-8 py-3 rounded-xl font-bold shadow-md flex items-center gap-2"
                  >
                    {savingSenha && <Loader2 size={16} className="animate-spin" />}
                    Alterar senha
                  </button>
                </div>
              </form>
            </div>
          )}

          {tab === 'notificacoes' && (
            <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
              <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Bell size={20} className="text-primary" /> Preferências de Notificação
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Escolha como você quer receber comunicações da ACIAV Saúde.
              </p>
              <div className="space-y-4">
                <NotifToggle
                  label="E-mail"
                  description="Resumos mensais, boas-vindas e alertas importantes."
                  checked={notifEmail}
                  onChange={setNotifEmail}
                />
                <NotifToggle
                  label="WhatsApp"
                  description="Mensagens diretas sobre atendimentos e benefícios."
                  checked={notifWhats}
                  onChange={setNotifWhats}
                />
                <NotifToggle
                  label="Novos credenciados"
                  description="Aviso quando entrar um novo credenciado na sua região."
                  checked={notifNewProviders}
                  onChange={setNotifNewProviders}
                />
              </div>
              <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleSaveNotif}
                  disabled={savingNotif}
                  className="bg-primary hover:bg-primary-dark disabled:opacity-60 text-white px-8 py-3 rounded-xl font-bold shadow-md flex items-center gap-2"
                >
                  {savingNotif && <Loader2 size={16} className="animate-spin" />}
                  Salvar preferências
                </button>
              </div>
            </div>
          )}

          {tab === 'privacidade' && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Download size={20} className="text-primary" /> Exportar meus dados
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Baixe uma planilha com todos os seus dados pessoais, atendimentos registrados e interações com o Guia de Credenciados (LGPD — Art. 18, II).
                </p>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                >
                  {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Baixar planilha (.xlsx)
                </button>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100">
                <h3 className="text-xl font-bold text-rose-700 mb-2 flex items-center gap-2">
                  <AlertCircle size={20} /> Solicitar exclusão da conta
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Sua solicitação será registrada e encaminhada para a administração. A exclusão definitiva é feita após análise (LGPD — Art. 18, VI). Atendimentos pagos permanecem retidos por obrigação legal.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Motivo da solicitação</label>
                    <textarea
                      rows={3}
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="Conte-nos o motivo..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-200 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                      Digite <span className="font-mono text-rose-600">CONFIRMAR</span> para prosseguir
                    </label>
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder="CONFIRMAR"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-200 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleRequestDeletion}
                      disabled={deleting || deleteConfirm !== 'CONFIRMAR' || deleteReason.trim().length < 5}
                      className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                    >
                      {deleting && <Loader2 size={16} className="animate-spin" />}
                      Solicitar exclusão
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

function NotifToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 accent-[#007178]"
      />
      <div>
        <p className="font-bold text-slate-800">{label}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </label>
  );
}
