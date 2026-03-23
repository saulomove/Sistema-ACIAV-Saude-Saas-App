import Link from 'next/link';
import Image from 'next/image';
import { Shield, Building2, Stethoscope, Users, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  { icon: Building2, title: 'Para Empresas', desc: 'Gerencie o plano de saúde dos seus colaboradores de forma simples e transparente.' },
  { icon: Users, title: 'Para Colaboradores', desc: 'Acesse sua carteirinha digital, guia de credenciados e histórico de atendimentos.' },
  { icon: Stethoscope, title: 'Para Credenciados', desc: 'Valide atendimentos, registre consultas e acompanhe sua produção em tempo real.' },
  { icon: Shield, title: 'Seguro e Confiável', desc: 'Plataforma com criptografia de dados e controle de acesso por perfil de usuário.' },
];

const benefits = [
  'Rede de clínicas e especialistas parceiros',
  'Economia de até 70% vs. planos convencionais',
  'Carteirinha digital no celular',
  'Gestão completa para o RH da empresa',
  'Relatórios de impacto e utilização',
  'Suporte dedicado para cada unidade',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="w-36 h-9 relative">
            <Image src="/logo-aciav-saude.png" alt="ACIAV Saúde" fill className="object-contain object-left" priority />
          </div>
          <Link
            href="/login"
            className="bg-secondary hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2"
          >
            Acessar o Sistema <ArrowRight size={15} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-[#005f65] text-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-white/15 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            Plataforma SaaS de Saúde Corporativa
          </span>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tight">
            O benefício de saúde que a sua empresa merece
          </h1>
          <p className="text-white/80 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            Conectamos empresas, colaboradores e clínicas em uma rede de saúde acessível, moderna e sem burocracia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-secondary hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              Acessar o Sistema <ArrowRight size={18} />
            </Link>
            <a
              href="#sobre"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-colors border border-white/20 flex items-center justify-center"
            >
              Saiba mais
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="sobre" className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">Uma plataforma para todos</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Cada perfil tem seu portal dedicado, com as ferramentas certas para o seu papel.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-secondary font-bold text-sm uppercase tracking-widest">Por que a ACIAV Saúde?</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mt-3 mb-6">Saúde acessível para toda a equipe</h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Oferecemos uma rede completa de médicos, dentistas e especialistas com valores muito abaixo dos planos de saúde convencionais — sem carência e sem burocracia.
            </p>
            <ul className="space-y-3">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-primary/5 to-secondary/10 rounded-3xl p-10 border border-primary/10">
            <div className="grid grid-cols-2 gap-6">
              {[
                { value: '10+', label: 'Unidades Ativas' },
                { value: '5.000+', label: 'Vidas Cobertas' },
                { value: '200+', label: 'Credenciados' },
                { value: '70%', label: 'Economia Média' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm text-center border border-gray-100">
                  <p className="text-3xl font-black text-primary">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-secondary to-orange-600 py-20 px-6 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Já tem acesso?</h2>
          <p className="text-white/80 text-lg mb-8">Entre no sistema com suas credenciais e acesse o seu portal.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-secondary hover:bg-slate-100 px-8 py-4 rounded-2xl font-bold text-lg transition-colors shadow-lg"
          >
            Acessar o Sistema <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white/50 py-8 px-6 text-center text-sm">
        <p>© 2026 ACIAV Saúde — Todos os direitos reservados. Feito com ❤️ pela Agência ArtDesign</p>
      </footer>
    </div>
  );
}
