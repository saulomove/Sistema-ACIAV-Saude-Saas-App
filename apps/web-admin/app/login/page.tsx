'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const ROLE_REDIRECT: Record<string, string> = {
  super_admin: '/dashboard',
  admin_unit: '/dashboard',
  rh: '/portal-rh',
  provider: '/portal-credenciado',
  patient: '/portal-paciente',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
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

      await fetch('/internal/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.token, role: data.user.role }),
      });

      const redirect = ROLE_REDIRECT[data.user.role] || '/dashboard';
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
      <div className="hidden lg:flex lg:w-1/2 bg-[#007178] flex-col justify-between p-12 relative overflow-hidden">
        {/* Decoração de fundo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="w-48 relative h-12">
            <Image
              src="/logo-aciav-saude.png"
              alt="ACIAV Saúde"
              fill
              className="object-contain object-left brightness-0 invert"
              priority
            />
          </div>
        </div>

        {/* Conteúdo central */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white/90 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
            Plataforma SaaS Multi-tenant
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-5 tracking-tight">
            O benefício de saúde que a sua empresa merece.
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Conectamos empresas, colaboradores e clínicas em uma rede de saúde acessível e moderna.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { value: '5.000+', label: 'Vidas cobertas' },
              { value: '200+', label: 'Credenciados' },
              { value: '70%', label: 'Economia média' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 rounded-2xl p-4 text-center border border-white/10">
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-xs text-white/60 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-4 text-white/40 text-sm">
          <span>© 2026 ACIAV Saúde</span>
          <span>·</span>
          <span>Todos os direitos reservados</span>
        </div>
      </div>

      {/* Lado direito — Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-8">
            <div className="w-40 h-10 relative">
              <Image src="/logo-aciav-saude.png" alt="ACIAV Saúde" fill className="object-contain" priority />
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Bem-vindo de volta</h2>
            <p className="text-slate-500 text-sm mt-1">Entre com suas credenciais para acessar o sistema.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com.br"
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178] bg-white transition text-sm"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178] bg-white transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#007178] hover:bg-[#005f65] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            Problemas para acessar?{' '}
            <span className="text-[#007178] font-medium">Entre em contato com o administrador.</span>
          </p>

          {/* Voltar para LP */}
          <div className="mt-6 text-center">
            <a href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              ← Voltar para o site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
