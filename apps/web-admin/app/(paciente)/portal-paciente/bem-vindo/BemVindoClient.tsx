'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';

interface Prefill {
  fullName: string;
  email: string;
  whatsapp: string;
  birthDate: string;
}

function formatWhatsapp(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function BemVindoClient({ prefill }: { prefill: Prefill }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState(prefill.fullName);
  const [email, setEmail] = useState(prefill.email);
  const [whatsapp, setWhatsapp] = useState(formatWhatsapp(prefill.whatsapp));
  const [birthDate, setBirthDate] = useState(prefill.birthDate);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validateStep1() {
    if (!fullName.trim()) return 'Informe seu nome completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Informe um e-mail válido.';
    const digits = whatsapp.replace(/\D/g, '');
    if (digits.length < 10) return 'Informe um WhatsApp válido com DDD.';
    return null;
  }

  function validateStep2() {
    if (password.length < 8) return 'A senha deve ter no mínimo 8 caracteres.';
    if (!/\d/.test(password)) return 'A senha deve conter ao menos um número.';
    if (password !== passwordConfirm) return 'As senhas não conferem.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const err1 = validateStep1();
    if (err1) { setError(err1); setStep(1); return; }
    const err2 = validateStep2();
    if (err2) { setError(err2); return; }

    setLoading(true);
    try {
      const res = await fetch('/internal/api/portal-paciente/first-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          whatsapp: whatsapp.replace(/\D/g, ''),
          birthDate: birthDate || undefined,
          newPassword: password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Não foi possível concluir o cadastro.');
        return;
      }
      // Sessão foi invalidada no backend — pedir novo login
      await fetch('/internal/logout', { method: 'POST' }).catch(() => {});
      router.push('/login?firstAccess=ok');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">
        {/* Stepper */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-[#007178]' : 'text-slate-400'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-[#007178] text-white' : 'bg-slate-200 text-slate-500'}`}>
              {step > 1 ? <CheckCircle2 size={14} /> : '1'}
            </div>
            <span className="text-sm font-bold">Seus dados</span>
          </div>
          <div className="flex-1 h-px bg-slate-200" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-[#007178]' : 'text-slate-400'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-[#007178] text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
            <span className="text-sm font-bold">Nova senha</span>
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Bem-vindo(a) à ACIAV Saúde!</h1>
        <p className="text-slate-500 text-sm mt-1">
          Antes de continuar, complete seu cadastro e crie uma senha pessoal.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178] text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  E-mail <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178] text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">Usaremos para redefinir sua senha se precisar.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
                  placeholder="(11) 99999-9999"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178] text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Data de nascimento</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178] text-sm"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
              )}

              <button
                type="button"
                onClick={() => {
                  const err = validateStep1();
                  if (err) { setError(err); return; }
                  setError('');
                  setStep(2);
                }}
                className="w-full bg-[#007178] hover:bg-[#005f65] text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                Continuar
              </button>
            </>
          )}

          {step === 2 && (
            <>
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
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Mínimo 8 caracteres, com ao menos um número.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirmar senha</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178] text-sm"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setError(''); setStep(1); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#007178] hover:bg-[#005f65] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Salvando...' : 'Concluir cadastro'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
