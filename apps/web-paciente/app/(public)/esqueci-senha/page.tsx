'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';

export default function EsqueciSenhaPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      if (!res.ok) {
        setError('Não foi possível processar. Tente novamente.');
        return;
      }
      setSent(true);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 safe-top safe-bottom">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex justify-center mb-6">
          <Image src="/logo-aciav-saude.png" alt="ACIAV Saúde" width={160} height={40} className="object-contain" />
        </div>

        {sent ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
            </div>
            <h1 className="text-xl font-black text-slate-800 text-center">Verifique seu e-mail</h1>
            <p className="text-slate-500 text-sm text-center mt-2">
              Se existir uma conta com os dados informados, enviamos um link para redefinir sua senha.
              O link expira em 15 minutos.
            </p>
            <Link
              href="/login"
              className="mt-6 w-full bg-[#007178] hover:bg-[#005f65] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center text-sm"
            >
              Voltar ao login
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-black text-slate-800">Esqueci minha senha</h1>
            <p className="text-slate-500 text-sm mt-1">
              Informe seu e-mail ou CPF que enviaremos um link para redefinir a senha.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">E-mail ou CPF</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="seu@email.com ou 000.000.000-00"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178] text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#007178] hover:bg-[#005f65] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>

            <Link
              href="/login"
              className="mt-6 text-center text-sm text-slate-500 hover:text-[#007178] flex items-center justify-center gap-1 transition-colors"
            >
              <ArrowLeft size={14} /> Voltar ao login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
