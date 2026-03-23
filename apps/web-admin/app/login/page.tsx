'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ROLE_REDIRECT: Record<string, string> = {
  super_admin: '/',
  admin_unit: '/',
  rh: '/portal-rh',
  provider: '/portal-credenciado',
  patient: '/portal-paciente',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'E-mail ou senha incorretos.');
        return;
      }

      // Salvar token via cookie (server action)
      await fetch('/api/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.token, role: data.user.role }),
      });

      const redirect = ROLE_REDIRECT[data.user.role] || '/';
      router.push(redirect);
    } catch {
      setError('Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#007178] flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-[#007178] font-black text-lg">A</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">ACIAV Saúde</span>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            O benefício de saúde que a sua empresa merece.
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Conectamos empresas, colaboradores e clínicas em uma rede de saúde acessível e moderna.
          </p>
        </div>

        <div className="flex items-center gap-6 text-white/60 text-sm">
          <span>© 2026 ACIAV Saúde</span>
          <span>Plataforma SaaS Multi-tenant</span>
        </div>
      </div>

      {/* Lado direito — Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#007178] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">A</span>
            </div>
            <span className="text-xl font-bold text-slate-800">ACIAV Saúde</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Bem-vindo de volta</h2>
          <p className="text-slate-500 text-sm mb-8">Entre com suas credenciais de acesso</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com.br"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178] bg-white transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178] bg-white transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#007178] hover:bg-[#005f65] disabled:bg-[#007178]/50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            Problemas para acessar? Entre em contato com o administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
