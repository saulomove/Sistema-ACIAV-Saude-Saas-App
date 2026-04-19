'use client';

import { useEffect, useState } from 'react';
import { Database, Download, Play, Mail, Send, Plus, Trash2, Webhook as WebhookIcon, FileDown, Save, CheckCircle } from 'lucide-react';
import ConfirmDeleteDialog from '../../../../components/ConfirmDeleteDialog';

export interface EmailIntegration {
  provider?: 'resend' | 'smtp';
  resendApiKey?: string;
  resendApiKeyMask?: string;
  fromEmail?: string;
  fromName?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpPassMask?: string;
  smtpSecure?: boolean;
}

interface BackupItem {
  id: string;
  fileName: string;
  sizeBytes: number;
  storageUrl?: string | null;
  status: string;
  createdAt: string;
  createdByName?: string | null;
}

interface WebhookItem {
  id: string;
  url: string;
  events: string;
  status: boolean;
  createdAt: string;
}

interface Props {
  unitId: string;
  emailInitial: EmailIntegration;
  rawSettings: Record<string, unknown>;
}

const WEBHOOK_EVENTS = ['user.created', 'transaction.created', 'company.created', 'provider.created', 'auth.login'];

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function fmtDate(s: string): string {
  try { return new Date(s).toLocaleString('pt-BR'); } catch { return s; }
}

export default function BackupTab({ unitId, emailInitial, rawSettings }: Props) {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [email, setEmail] = useState<Required<EmailIntegration>>({
    provider: emailInitial.provider ?? 'resend',
    resendApiKey: '',
    resendApiKeyMask: emailInitial.resendApiKeyMask ?? '',
    fromEmail: emailInitial.fromEmail ?? 'noreply@aciavsaude.com.br',
    fromName: emailInitial.fromName ?? 'ACIAV Saúde',
    smtpHost: emailInitial.smtpHost ?? '',
    smtpPort: emailInitial.smtpPort ?? 587,
    smtpUser: emailInitial.smtpUser ?? '',
    smtpPass: '',
    smtpPassMask: emailInitial.smtpPassMask ?? '',
    smtpSecure: emailInitial.smtpSecure ?? false,
  });
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);

  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loadingHooks, setLoadingHooks] = useState(true);
  const [newHook, setNewHook] = useState({ url: '', events: [] as string[] });
  const [creatingHook, setCreatingHook] = useState(false);
  const [hookDeleteTarget, setHookDeleteTarget] = useState<WebhookItem | null>(null);
  const [hookBusy, setHookBusy] = useState(false);

  const [exporting, setExporting] = useState(false);

  async function loadBackups() {
    setLoadingBackups(true);
    try {
      const res = await fetch('/internal/api/backup');
      if (res.ok) {
        const data = await res.json();
        setBackups(Array.isArray(data) ? data : data?.data ?? []);
      }
    } finally {
      setLoadingBackups(false);
    }
  }

  async function loadWebhooks() {
    setLoadingHooks(true);
    try {
      const res = await fetch(`/internal/api/webhooks?unitId=${unitId}`);
      if (res.ok) {
        const data = await res.json();
        setWebhooks(Array.isArray(data) ? data : data?.data ?? []);
      }
    } finally {
      setLoadingHooks(false);
    }
  }

  useEffect(() => { loadBackups(); loadWebhooks(); }, [unitId]);

  async function handleGenerateBackup() {
    setGenerating(true);
    try {
      const res = await fetch('/internal/api/backup/run', { method: 'POST' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Erro');
      await loadBackups();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownloadBackup(id: string) {
    try {
      const res = await fetch(`/internal/download/backup/${id}/download`);
      if (!res.ok) throw new Error('Falha ao baixar.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${id}.json.gz`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function handleSaveEmail() {
    setSavingEmail(true);
    setEmailSaved(false);
    try {
      const emailToSave: EmailIntegration = {
        provider: email.provider,
        fromEmail: email.fromEmail,
        fromName: email.fromName,
      };
      if (email.provider === 'resend' && email.resendApiKey) {
        emailToSave.resendApiKey = email.resendApiKey;
      }
      if (email.provider === 'smtp') {
        emailToSave.smtpHost = email.smtpHost;
        emailToSave.smtpPort = email.smtpPort;
        emailToSave.smtpUser = email.smtpUser;
        emailToSave.smtpSecure = email.smtpSecure;
        if (email.smtpPass) emailToSave.smtpPass = email.smtpPass;
      }
      const prevIntegrations = (rawSettings.integrations as Record<string, unknown>) || {};
      const merged = { ...rawSettings, integrations: { ...prevIntegrations, email: emailToSave } };
      const res = await fetch(`/internal/api/units/${unitId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: JSON.stringify(merged) }),
      });
      if (!res.ok) throw new Error();
      setEmailSaved(true);
      setEmail((e) => ({ ...e, resendApiKey: '', smtpPass: '' }));
      setTimeout(() => setEmailSaved(false), 3000);
    } catch {
      alert('Erro ao salvar integrações.');
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleTestEmail() {
    setEmailTesting(true);
    try {
      const res = await fetch(`/internal/api/units/${unitId}/email/test`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha no teste.');
      alert('E-mail de teste enviado.');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setEmailTesting(false);
    }
  }

  async function handleCreateHook() {
    if (!newHook.url || newHook.events.length === 0) {
      alert('Informe URL e pelo menos um evento.');
      return;
    }
    setCreatingHook(true);
    try {
      const res = await fetch('/internal/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, url: newHook.url, events: newHook.events.join(',') }),
      });
      if (!res.ok) throw new Error();
      setNewHook({ url: '', events: [] });
      await loadWebhooks();
    } catch {
      alert('Erro ao criar webhook.');
    } finally {
      setCreatingHook(false);
    }
  }

  async function handleTestHook(id: string) {
    try {
      const res = await fetch(`/internal/api/webhooks/${id}/test`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha no teste.');
      alert('Webhook de teste enviado.');
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function confirmDeleteHook() {
    if (!hookDeleteTarget) return;
    setHookBusy(true);
    try {
      const res = await fetch(`/internal/api/webhooks/${hookDeleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setHookDeleteTarget(null);
      await loadWebhooks();
    } catch {
      alert('Erro ao remover webhook.');
    } finally {
      setHookBusy(false);
    }
  }

  async function handleFullExport() {
    setExporting(true);
    try {
      const res = await fetch(`/internal/download/units/${unitId}/full-export`);
      if (!res.ok) throw new Error('Falha ao gerar exportação.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aciav-full-export-${unitId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  const lastBackup = backups[0];

  return (
    <div className="space-y-6">
      {/* Backup */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Database className="text-primary" size={20} /> Backup do Banco
          </h3>
          <button
            onClick={handleGenerateBackup}
            disabled={generating}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-60"
          >
            <Play size={16} /> {generating ? 'Gerando...' : 'Gerar backup agora'}
          </button>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 mb-4">
          Backup automático diário às 03:00 está ativo. Últimos 30 backups mantidos no servidor.
          {lastBackup && (<span className="ml-2">Último: <strong>{fmtDate(lastBackup.createdAt)}</strong> ({fmtBytes(lastBackup.sizeBytes)})</span>)}
        </div>
        {loadingBackups ? (
          <div className="text-center py-6 text-slate-400 text-sm">Carregando...</div>
        ) : backups.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">Nenhum backup registrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-xs text-slate-500 uppercase">
                <th className="text-left px-4 py-2 font-bold">Arquivo</th>
                <th className="text-left px-4 py-2 font-bold">Data</th>
                <th className="text-left px-4 py-2 font-bold">Tamanho</th>
                <th className="text-left px-4 py-2 font-bold">Status</th>
                <th className="text-right px-4 py-2 font-bold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {backups.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2 font-mono text-xs text-slate-600">{b.fileName}</td>
                  <td className="px-4 py-2 text-slate-600">{fmtDate(b.createdAt)}</td>
                  <td className="px-4 py-2 text-slate-600">{fmtBytes(b.sizeBytes)}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : b.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {b.status === 'completed' && b.storageUrl && (
                      <button onClick={() => handleDownloadBackup(b.id)} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded">
                        <Download size={14} /> Baixar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* E-mail */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Mail className="text-primary" size={20} /> Provedor de E-mail
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleTestEmail}
              disabled={emailTesting}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-60"
            >
              <Send size={16} /> {emailTesting ? 'Enviando...' : 'Enviar teste'}
            </button>
            <button
              onClick={handleSaveEmail}
              disabled={savingEmail}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-60"
            >
              {emailSaved ? (<><CheckCircle size={16} /> Salvo!</>) : (<><Save size={16} /> {savingEmail ? 'Salvando...' : 'Salvar'}</>)}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Provedor</label>
            <select
              value={email.provider}
              onChange={(e) => setEmail({ ...email, provider: e.target.value as 'resend' | 'smtp' })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="resend">Resend</option>
              <option value="smtp">SMTP</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Remetente (From Name)</label>
            <input
              type="text"
              value={email.fromName}
              onChange={(e) => setEmail({ ...email, fromName: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">E-mail do remetente</label>
            <input
              type="email"
              value={email.fromEmail}
              onChange={(e) => setEmail({ ...email, fromEmail: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {email.provider === 'resend' && (
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Resend API Key {email.resendApiKeyMask && <span className="text-slate-400">(atual: {email.resendApiKeyMask})</span>}
              </label>
              <input
                type="password"
                value={email.resendApiKey}
                onChange={(e) => setEmail({ ...email, resendApiKey: e.target.value })}
                placeholder={email.resendApiKeyMask ? 'Deixe em branco para manter a atual' : 're_xxxxxxxx'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>
          )}

          {email.provider === 'smtp' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">SMTP Host</label>
                <input type="text" value={email.smtpHost} onChange={(e) => setEmail({ ...email, smtpHost: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Porta</label>
                <input type="number" value={email.smtpPort} onChange={(e) => setEmail({ ...email, smtpPort: Number(e.target.value) || 587 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Usuário</label>
                <input type="text" value={email.smtpUser} onChange={(e) => setEmail({ ...email, smtpUser: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Senha {email.smtpPassMask && <span className="text-slate-400">(atual: {email.smtpPassMask})</span>}
                </label>
                <input type="password" value={email.smtpPass} onChange={(e) => setEmail({ ...email, smtpPass: e.target.value })} placeholder={email.smtpPassMask ? 'Deixe em branco para manter' : ''} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
                <input type="checkbox" checked={email.smtpSecure} onChange={(e) => setEmail({ ...email, smtpSecure: e.target.checked })} className="w-4 h-4 accent-primary" />
                Conexão segura (TLS)
              </label>
            </>
          )}
        </div>
      </div>

      {/* Webhooks */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <WebhookIcon className="text-primary" size={20} /> Webhooks
        </h3>

        <div className="space-y-3 mb-5 p-4 bg-slate-50 rounded-lg">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">URL de destino</label>
            <input
              type="url"
              value={newHook.url}
              onChange={(e) => setNewHook({ ...newHook, url: e.target.value })}
              placeholder="https://exemplo.com/webhook"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Eventos</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {WEBHOOK_EVENTS.map((ev) => (
                <label key={ev} className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={newHook.events.includes(ev)}
                    onChange={(e) => setNewHook((n) => ({ ...n, events: e.target.checked ? [...n.events, ev] : n.events.filter((x) => x !== ev) }))}
                    className="w-4 h-4 accent-primary"
                  />
                  <code className="font-mono">{ev}</code>
                </label>
              ))}
            </div>
          </div>
          <button
            onClick={handleCreateHook}
            disabled={creatingHook}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-60"
          >
            <Plus size={16} /> {creatingHook ? 'Criando...' : 'Adicionar webhook'}
          </button>
        </div>

        {loadingHooks ? (
          <div className="text-center py-6 text-slate-400 text-sm">Carregando...</div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">Nenhum webhook configurado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-xs text-slate-500 uppercase">
                <th className="text-left px-4 py-2 font-bold">URL</th>
                <th className="text-left px-4 py-2 font-bold">Eventos</th>
                <th className="text-left px-4 py-2 font-bold">Status</th>
                <th className="text-right px-4 py-2 font-bold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {webhooks.map((w) => (
                <tr key={w.id}>
                  <td className="px-4 py-2 font-mono text-xs text-slate-600 truncate max-w-xs">{w.url}</td>
                  <td className="px-4 py-2 text-xs text-slate-500">{w.events}</td>
                  <td className="px-4 py-2">
                    {w.status ? <span className="text-emerald-600 text-xs font-bold">Ativo</span> : <span className="text-slate-400 text-xs font-bold">Inativo</span>}
                  </td>
                  <td className="px-4 py-2 text-right space-x-1">
                    <button onClick={() => handleTestHook(w.id)} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded">
                      <Send size={14} /> Testar
                    </button>
                    <button onClick={() => setHookDeleteTarget(w)} className="inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:bg-red-50 px-2 py-1 rounded">
                      <Trash2 size={14} /> Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Export LGPD */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
          <FileDown className="text-primary" size={20} /> Exportação LGPD
        </h3>
        <p className="text-sm text-slate-500 mb-4">Baixe uma planilha Excel com abas para todos os dados da unidade (beneficiários, empresas, credenciados, atendimentos, auditoria).</p>
        <button
          onClick={handleFullExport}
          disabled={exporting}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-60"
        >
          <FileDown size={16} /> {exporting ? 'Gerando...' : 'Exportar todos os dados'}
        </button>
      </div>

      <ConfirmDeleteDialog
        open={!!hookDeleteTarget}
        title="Remover webhook"
        description={hookDeleteTarget ? `Remover o webhook para ${hookDeleteTarget.url}?` : ''}
        busy={hookBusy}
        confirmButtonLabel="Remover"
        onConfirm={confirmDeleteHook}
        onClose={() => setHookDeleteTarget(null)}
      />
    </div>
  );
}
