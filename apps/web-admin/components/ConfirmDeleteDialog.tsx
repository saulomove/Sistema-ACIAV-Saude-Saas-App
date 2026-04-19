'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface Props {
  open: boolean;
  title?: string;
  description?: string;
  targetLabel?: string;
  confirmWord?: string;
  confirmButtonLabel?: string;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export default function ConfirmDeleteDialog({
  open,
  title = 'Confirmar exclusão',
  description = 'Esta ação é irreversível. Digite CONFIRMAR para prosseguir.',
  targetLabel,
  confirmWord = 'CONFIRMAR',
  confirmButtonLabel = 'Excluir',
  busy = false,
  onConfirm,
  onClose,
}: Props) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  if (!open) return null;

  const canConfirm = typed === confirmWord && !busy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
          </div>
          <button onClick={onClose} disabled={busy} className="text-slate-400 hover:text-slate-600 disabled:opacity-50">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600">{description}</p>
          {targetLabel && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium">
              {targetLabel}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Digite <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{confirmWord}</span> para confirmar
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              autoComplete="off"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
              placeholder={confirmWord}
              disabled={busy}
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {confirmButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
