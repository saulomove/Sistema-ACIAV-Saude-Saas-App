'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { History, Search, X, Calendar, User as UserIcon, FileText } from 'lucide-react';

interface AuditLog {
  id: string;
  unitId: string | null;
  actorAuthUserId: string | null;
  actorName: string | null;
  actorRole: string | null;
  entity: string;
  entityId: string | null;
  action: string;
  diffBefore: unknown;
  diffAfter: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface PaginatedResponse {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

const ENTITY_OPTIONS = [
  { value: '', label: 'Todas as entidades' },
  { value: 'users', label: 'Beneficiários' },
  { value: 'companies', label: 'Empresas' },
  { value: 'providers', label: 'Credenciados' },
  { value: 'transactions', label: 'Transações' },
  { value: 'auth', label: 'Autenticação' },
  { value: 'export', label: 'Exportações' },
];

const ACTION_LABELS: Record<string, { label: string; className: string }> = {
  create: { label: 'Criação', className: 'bg-emerald-50 text-emerald-700' },
  update: { label: 'Edição', className: 'bg-blue-50 text-blue-700' },
  delete: { label: 'Exclusão', className: 'bg-red-50 text-red-700' },
  login: { label: 'Login', className: 'bg-indigo-50 text-indigo-700' },
  reset_password: { label: 'Reset senha', className: 'bg-amber-50 text-amber-700' },
  import: { label: 'Importação', className: 'bg-purple-50 text-purple-700' },
  export: { label: 'Exportação', className: 'bg-sky-50 text-sky-700' },
  status_change: { label: 'Status', className: 'bg-slate-100 text-slate-700' },
  transfer: { label: 'Transferência', className: 'bg-orange-50 text-orange-700' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
}

function actionBadge(action: string) {
  const def = ACTION_LABELS[action] ?? { label: action, className: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${def.className}`}>
      {def.label}
    </span>
  );
}

export default function AuditoriaClient({ role }: { role: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (entity) qs.set('entity', entity);
    if (action) qs.set('action', action);
    if (startDate) qs.set('startDate', startDate);
    if (endDate) qs.set('endDate', endDate);
    qs.set('page', String(page));
    qs.set('limit', String(limit));

    try {
      const res = await fetch(`/internal/api/audit?${qs.toString()}`);
      if (!res.ok) throw new Error('Falha ao carregar auditoria');
      const data: PaginatedResponse = await res.json();
      setLogs(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [entity, action, startDate, endDate, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = useMemo(() => {
    if (!search) return logs;
    const s = search.toLowerCase();
    return logs.filter(
      (l) =>
        (l.actorName ?? '').toLowerCase().includes(s) ||
        (l.entity ?? '').toLowerCase().includes(s) ||
        (l.entityId ?? '').toLowerCase().includes(s) ||
        (l.action ?? '').toLowerCase().includes(s),
    );
  }, [logs, search]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <History size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Auditoria do Sistema</h1>
          <p className="text-sm text-slate-500">
            Registro de todas as ações executadas no painel ({role === 'super_admin' ? 'visão global' : 'visão da sua unidade'})
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Entidade</label>
            <select
              value={entity}
              onChange={(e) => {
                setPage(1);
                setEntity(e.target.value);
              }}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm"
            >
              {ENTITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ação</label>
            <select
              value={action}
              onChange={(e) => {
                setPage(1);
                setAction(e.target.value);
              }}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm"
            >
              <option value="">Todas</option>
              {Object.entries(ACTION_LABELS).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">De</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setPage(1);
                setStartDate(e.target.value);
              }}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Até</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setPage(1);
                setEndDate(e.target.value);
              }}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Buscar</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ator, entidade, ID..."
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-semibold">Data</th>
                <th className="px-4 py-3 text-left font-semibold">Ator</th>
                <th className="px-4 py-3 text-left font-semibold">Ação</th>
                <th className="px-4 py-3 text-left font-semibold">Entidade</th>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-right font-semibold">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Carregando...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{log.actorName ?? '—'}</div>
                      <div className="text-xs text-slate-400">{log.actorRole ?? ''}</div>
                    </td>
                    <td className="px-4 py-3">{actionBadge(log.action)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{log.entity}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {log.entityId ? log.entityId.slice(0, 8) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(log)}
                        className="text-primary hover:underline text-xs font-semibold"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {total} registro{total !== 1 ? 's' : ''} · página {page} de {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelected(null)}>
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Detalhes da ação</h2>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <Field icon={Calendar} label="Data" value={formatDate(selected.createdAt)} />
              <Field icon={UserIcon} label="Ator" value={`${selected.actorName ?? '—'} (${selected.actorRole ?? ''})`} />
              <Field icon={FileText} label="Entidade" value={selected.entity} />
              <Field icon={FileText} label="ID" value={selected.entityId ?? '—'} />
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1">Ação</div>
                <div>{actionBadge(selected.action)}</div>
              </div>
              {selected.diffBefore !== null && selected.diffBefore !== undefined && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">Estado anterior</div>
                  <pre className="bg-slate-50 rounded-lg p-3 text-xs overflow-x-auto border border-slate-100">
                    {JSON.stringify(selected.diffBefore, null, 2)}
                  </pre>
                </div>
              )}
              {selected.diffAfter !== null && selected.diffAfter !== undefined && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">Estado novo</div>
                  <pre className="bg-slate-50 rounded-lg p-3 text-xs overflow-x-auto border border-slate-100">
                    {JSON.stringify(selected.diffAfter, null, 2)}
                  </pre>
                </div>
              )}
              <div className="text-xs text-slate-400 pt-3 border-t border-slate-100">
                <div>IP: {selected.ip ?? '—'}</div>
                <div className="mt-1 truncate">UA: {selected.userAgent ?? '—'}</div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-500">{label}</div>
        <div className="text-slate-800 break-words">{value}</div>
      </div>
    </div>
  );
}
