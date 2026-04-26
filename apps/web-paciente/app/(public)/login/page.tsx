'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

type Mode = 'cpf' | 'email';

function maskCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('cpf');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [firstAccessOk, setFirstAccessOk] = useState(false);
  const [roleError, setRoleError] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('firstAccess') === 'ok') setFirstAccessOk(true);
    if (sp.get('error') === 'role') setRoleError(true);
  }, []);

  function handleIdentifierChange(value: string) {
    if (mode === 'cpf') setIdentifier(maskCpf(value));
    else setIdentifier(value);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setIdentifier('');
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const sent = mode === 'cpf' ? identifier.replace(/\D/g, '') : identifier.trim().toLowerCase();
    if (mode === 'cpf' && sent.length !== 11) {
      setError('Informe um CPF válido com 11 dígitos.');
      setLoading(false);
      return;
    }
    if (mode === 'email' && !sent.includes('@')) {
      setError('Informe um e-mail válido.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sent, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Credenciais inválidas.');
        return;
      }

      if (data?.user?.role !== 'patient') {
        setError('Esta área é exclusiva para pacientes. Use o painel administrativo.');
        return;
      }

      await fetch('/internal/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.token, role: data.user.role }),
      });

      router.push('/portal');
    } catch {
      setError('Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#007178] via-[#005f65] to-[#004f54] flex flex-col safe-top safe-bottom">
      {/* Top branding */}
      <div className="flex-1 flex flex-col justify-end items-center px-6 pt-12 pb-8 text-white">
        <Image
          src="/logo-aciav-saude.png"
          alt="ACIAV Saúde"
          width={180}
          height={48}
          className="object-contain brightness-0 invert"
          priority
        />
        <h1 className="mt-6 text-2xl font-black text-center tracking-tight">Sua carteirinha digital</h1>
        <p className="mt-2 text-white/80 text-sm text-center max-w-xs">
          Apresente nos credenciados, encontre parceiros e veja suas economias.
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-t-[2rem] px-6 pt-7 pb-8 shadow-2xl">
        <h2 className="text-lg font-black text-slate-800">Entrar</h2>
        <p className="text-slate-500 text-xs mt-1">Use seu CPF ou e-mail cadastrado.</p>

        {firstAccessOk && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
            <CheckCircle2 size={14} />
            Cadastro concluído! Faça login com sua nova senha.
          </div>
        )}

        {roleError && (
          <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-xl flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>Esta área é exclusiva para pacientes. Acesse o painel administrativo para outros perfis.</span>
          </div>
        )}

        {/* Mode toggle */}
        <div className="mt-5 grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => switchMode('cpf')}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'cpf' ? 'bg-white text-[#007178] shadow-sm' : 'text-slate-500'
            }`}
          >
            CPF
          </button>
          <button
            type="button"
            onClick={() => switchMode('email')}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'email' ? 'bg-white text-[#007178] shadow-sm' : 'text-slate-500'
            }`}
          >
            E-mail
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              {mode === 'cpf' ? 'CPF' : 'E-mail'}
            </label>
            <input
              type={mode === 'cpf' ? 'tel' : 'email'}
              inputMode={mode === 'cpf' ? 'numeric' : 'email'}
              autoComplete={mode === 'cpf' ? 'username' : 'email'}
              value={identifier}
              onChange={(e) => handleIdentifierChange(e.target.value)}
              placeholder={mode === 'cpf' ? '000.000.000-00' : 'seu@email.com'}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178] bg-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Senha</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178] bg-white text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#007178] hover:bg-[#005f65] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="text-center pt-1">
            <Link href="/esqueci-senha" className="text-xs text-[#007178] hover:underline font-medium">
              Esqueci minha senha
            </Link>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Primeiro acesso? Use seu <strong>CPF</strong> como login e senha — você será solicitado a definir uma nova senha.
          </p>
        </div>
      </div>
    </div>
  );
}
