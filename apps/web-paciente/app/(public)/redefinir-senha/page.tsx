'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';

function RedefinirSenhaInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [state, setState] = useState<'loading' | 'invalid' | 'ready' | 'done'>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    (async () => {
      try {
        const res = await fetch(`/api/auth/reset-validate?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({ valid: false }));
        setState(data.valid ? 'ready' : 'invalid');
      } catch {
        setState('invalid');
      }
    })();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8 || !/\d/.test(password)) {
      setError('A senha deve ter no mínimo 8 caracteres e conter ao menos um número.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não conferem.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Não foi possível redefinir. Solicite um novo link.');
        return;
      }
      setState('done');
      setTimeout(() => router.push('/login'), 2500);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      <div className="flex justify-center mb-6">
        <Image src="/logo-aciav-saude.png" alt="ACIAV Saúde" width={160} height={40} className="object-contain" />
      </div>

      {state === 'loading' && (
        <div className="py-8 flex justify-center">
          <Loader2 size={28} className="animate-spin text-[#007178]" />
        </div>
      )}

      {state === 'invalid' && (
        <>
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <ShieldAlert size={28} className="text-red-600" />
            </div>
          </div>
          <h1 className="text-xl font-black text-slate-800 text-center">Link inválido ou expirado</h1>
          <p className="text-slate-500 text-sm text-center mt-2">
            Este link de redefinição não é mais válido. Solicite um novo pelo link abaixo.
          </p>
          <Link
            href="/esqueci-senha"
            className="mt-6 w-full bg-[#007178] hover:bg-[#005f65] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center text-sm"
          >
            Solicitar novo link
          </Link>
        </>
      )}

      {state === 'ready' && (
        <>
          <h1 className="text-xl font-black text-slate-800">Crie uma nova senha</h1>
          <p className="text-slate-500 text-sm mt-1">
            Digite a sua nova senha abaixo. Depois, use ela para entrar no sistema.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Nova senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178] text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Mínimo 8 caracteres, com ao menos um número.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirmar senha</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178] text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#007178] hover:bg-[#005f65] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </form>
        </>
      )}

      {state === 'done' && (
        <>
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
          </div>
          <h1 className="text-xl font-black text-slate-800 text-center">Senha atualizada!</h1>
          <p className="text-slate-500 text-sm text-center mt-2">
            Redirecionando para o login...
          </p>
        </>
      )}
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 safe-top safe-bottom">
      <Suspense
        fallback={
          <div className="py-8 flex justify-center">
            <Loader2 size={28} className="animate-spin text-[#007178]" />
          </div>
        }
      >
        <RedefinirSenhaInner />
      </Suspense>
    </div>
  );
}
