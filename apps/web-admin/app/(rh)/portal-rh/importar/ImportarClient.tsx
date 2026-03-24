'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet, Upload, Download, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { api } from '../../../../lib/api-client';

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

const CSV_TEMPLATE = `fullName,cpf
João da Silva,12345678901
Maria Souza,98765432100`;

export default function ImportarClient({ companyId, unitId }: { companyId: string; unitId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-colaboradores.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setError('');
  }

  async function parseCSV(text: string): Promise<Array<{ fullName: string; cpf: string; unitId: string; companyId: string; type: string }>> {
    const lines = text.trim().split('\n');
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const [fullName, cpf] = lines[i].split(',').map((s) => s.trim().replace(/"/g, ''));
      const cleanCpf = cpf.replace(/\D/g, '');
      if (fullName && cleanCpf) {
        if (cleanCpf.length !== 11) {
          throw new Error(`Linha ${i + 1}: CPF "${cpf}" inválido — deve conter 11 dígitos.`);
        }
        rows.push({
          fullName,
          cpf: cleanCpf,
          unitId,
          companyId,
          type: 'titular',
        });
      }
    }
    return rows;
  }

  async function handleImport() {
    if (!file) { setError('Selecione um arquivo CSV.'); return; }
    if (!companyId || !unitId) { setError('Configuração de empresa ou unidade inválida.'); return; }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const text = await file.text();
      const users = await parseCSV(text);

      if (users.length === 0) {
        setError('Nenhum dado válido encontrado no arquivo.');
        return;
      }

      const res = await api.post('/users/import', { users }) as ImportResult;
      setResult(res);
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao importar colaboradores.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="text-secondary" /> Importar Planilha
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Importe múltiplos colaboradores de uma vez via arquivo CSV.
        </p>
      </div>

      {/* Template */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-slate-700 mb-3">1. Baixe o modelo</h2>
        <p className="text-sm text-slate-500 mb-4">
          Use o arquivo modelo para garantir o formato correto. Colunas obrigatórias: <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">fullName</code> e <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">cpf</code>.
        </p>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Download size={16} /> Baixar modelo CSV
        </button>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-slate-700 mb-3">2. Envie o arquivo preenchido</h2>

        <div
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${file ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50 hover:bg-slate-50'}`}
        >
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileSpreadsheet className="text-primary" size={28} />
              <div className="text-left">
                <p className="font-bold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                className="ml-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              <Upload className="mx-auto mb-3 text-slate-300" size={36} />
              <p className="text-slate-500 font-medium">Clique para selecionar o arquivo CSV</p>
              <p className="text-xs text-slate-400 mt-1">Somente arquivos .csv</p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="w-full mt-4 bg-secondary hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          {loading ? 'Importando...' : 'Importar Colaboradores'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="text-emerald-500" size={20} />
            <h2 className="font-bold text-slate-700">Importação concluída</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-emerald-700">{result.created}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">Criados</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-yellow-700">{result.skipped}</p>
              <p className="text-xs text-yellow-600 font-medium mt-1">Ignorados (CPF duplicado)</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-red-700">{result.errors.length}</p>
              <p className="text-xs text-red-600 font-medium mt-1">Erros</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs font-bold text-red-700 mb-2">Erros encontrados:</p>
              <ul className="text-xs text-red-600 space-y-1">
                {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
