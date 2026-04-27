'use client';

import { useState } from 'react';
import {
  Building2,
  Users,
  Stethoscope,
  Check,
  Search,
  Calendar,
  FileText,
  MessageCircle,
  Heart,
} from 'lucide-react';
import { LOGIN_HREF, PACIENTE_URL, CONTACT_HREF } from '../../lib/urls';

type TabId = 'empresas' | 'colaboradores' | 'credenciados';

const TABS: { id: TabId; label: string; Icon: typeof Building2 }[] = [
  { id: 'empresas', label: 'Empresas', Icon: Building2 },
  { id: 'colaboradores', label: 'Colaboradores', Icon: Users },
  { id: 'credenciados', label: 'Credenciados', Icon: Stethoscope },
];

const FEATURES: Record<TabId, { title: string; sub: string }[]> = {
  empresas: [
    { title: 'Onboarding em 1 clique', sub: 'Adicione colaboradores em massa via planilha ou um a um.' },
    { title: 'Relatórios inteligentes', sub: 'Atendimentos, áreas mais usadas, ROI do benefício e tendências.' },
    { title: 'Faturamento previsível', sub: 'Mensalidade fixa por colaborador. Sem coparticipação surpresa.' },
  ],
  colaboradores: [
    { title: 'Carteirinha sempre com você', sub: 'QR code aceito em toda a rede. Funciona sem internet também.' },
    { title: 'Encontre médicos perto', sub: 'Busca por especialidade, localização e disponibilidade real.' },
    { title: 'Histórico unificado', sub: 'Veja consultas anteriores, exames e prescrições em um só lugar.' },
  ],
  credenciados: [
    { title: 'Validação por QR Code', sub: 'Confirme o atendimento em segundos. Sem ligação, sem fax.' },
    { title: 'Dashboard de produção', sub: 'Acompanhe atendimentos, faturamento e prazos de repasse.' },
    { title: 'Visibilidade na rede', sub: 'Apareça nas buscas dos colaboradores próximos à sua unidade.' },
  ],
};

const TITLES: Record<TabId, { h: string; p: string; cta: { label: string; href: string } }> = {
  empresas: {
    h: 'Gestão de saúde feita para o RH moderno.',
    p: 'Inclua colaboradores, acompanhe utilização, controle custos e gere relatórios em tempo real — tudo em um painel intuitivo, sem planilha.',
    cta: { label: 'Quero para minha empresa', href: LOGIN_HREF },
  },
  colaboradores: {
    h: 'Cuidado na palma da mão, sem complicação.',
    p: 'Carteirinha digital, médicos próximos, agendamento direto e histórico completo — tudo no app. Sem fila, sem ligar pra central, sem papel.',
    cta: { label: 'Conhecer o app', href: PACIENTE_URL },
  },
  credenciados: {
    h: 'Mais pacientes, menos burocracia.',
    p: 'Receba pacientes da rede ACI, valide atendimentos com 1 clique e acompanhe sua produção em tempo real. O repasse é rápido, transparente e previsível.',
    cta: { label: 'Quero ser credenciado', href: CONTACT_HREF },
  },
};

export default function Profiles() {
  const [active, setActive] = useState<TabId>('empresas');

  return (
    <section
      id="perfis"
      className="py-[110px]"
      style={{ background: 'linear-gradient(180deg, #f7f5f1 0%, #ffffff 100%)' }}
    >
      <div className="max-w-[1200px] mx-auto px-7">
        {/* Section head */}
        <div className="text-center max-w-[720px] mx-auto mb-15">
          <span className="inline-flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-[0.18em]">
            <span className="w-6 h-0.5 bg-orange-500" />
            Uma plataforma para todos
          </span>
          <h2 className="text-[clamp(34px,3.8vw,50px)] leading-[1.05] tracking-[-0.025em] font-extrabold mt-3.5 mb-4 text-ink">
            O portal certo, <span className="font-serif">para cada papel.</span>
          </h2>
          <p className="text-muted text-[17px]">
            RH, colaborador e clínica trabalham no mesmo ecossistema — cada um com a interface, dados e
            ferramentas que precisam.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-white rounded-full mx-auto mb-12 w-fit shadow-md">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                className={`px-5 py-3 rounded-full font-semibold text-sm inline-flex items-center gap-2 transition-all duration-200 ${
                  isActive
                    ? 'bg-ink text-white shadow-[0_6px_16px_-6px_rgba(12,30,42,.4)]'
                    : 'bg-transparent text-ink-2 hover:text-teal-800'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab panels */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-15 items-center">
          {/* Text */}
          <div>
            <h3 className="text-[32px] tracking-[-0.02em] font-extrabold leading-[1.1] mb-3.5">
              {TITLES[active].h}
            </h3>
            <p className="text-muted text-[16px] leading-[1.6] mb-5">{TITLES[active].p}</p>
            <ul className="space-y-0 mb-7 list-none p-0">
              {FEATURES[active].map((f, i, arr) => (
                <li
                  key={f.title}
                  className={`flex gap-3 items-start py-3 ${
                    i < arr.length - 1 ? 'border-b border-dashed border-line' : ''
                  }`}
                >
                  <span className="w-[22px] h-[22px] rounded-full bg-teal-50 text-teal-700 grid place-items-center shrink-0 mt-0.5">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <div>
                    <strong className="block text-sm text-ink mb-0.5">{f.title}</strong>
                    <span className="text-muted text-[13px]">{f.sub}</span>
                  </div>
                </li>
              ))}
            </ul>
            <a
              href={TITLES[active].cta.href}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm bg-orange-500 text-white transition-all duration-200 hover:bg-orange-600 hover:-translate-y-0.5 shadow-[0_8px_22px_-8px_rgba(232,93,31,.6)]"
            >
              {TITLES[active].cta.label} <span>→</span>
            </a>
          </div>

          {/* Visual mock per tab */}
          <div
            className="relative rounded-[22px] p-7 overflow-hidden text-white"
            style={{
              aspectRatio: '4 / 3.2',
              background: 'linear-gradient(135deg, #08494a, #14807e)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 20% 80%, rgba(232,93,31,.25), transparent 50%)',
              }}
            />
            <div className="relative z-10 h-full">
              {active === 'empresas' && <DashboardMock />}
              {active === 'colaboradores' && <PhoneMock />}
              {active === 'credenciados' && <AgendaMock />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =============== Mocks =============== */

function DashboardMock() {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-[13px] opacity-80 tracking-[0.04em]">Painel · Dashboard RH</span>
        <span className="text-[10px] px-2.5 py-1 bg-mint-bright/20 text-mint-bright rounded-full font-bold inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-mint-bright animate-pulse-dot" />
          ao vivo
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {[
          { k: 'Ativos', v: '142', t: '+8 este mês' },
          { k: 'Atendimentos', v: '487', t: '↑ 12%' },
          { k: 'Economia', v: '68%', t: 'vs. plano antigo' },
        ].map((kpi) => (
          <div key={kpi.k} className="bg-white/8 rounded-xl p-3.5 backdrop-blur-md">
            <div className="text-[11px] opacity-75 tracking-[0.04em] uppercase font-semibold">{kpi.k}</div>
            <div className="text-2xl font-extrabold tracking-[-0.02em] mt-1.5">{kpi.v}</div>
            <div className="text-[11px] text-mint-bright mt-0.5 font-semibold">{kpi.t}</div>
          </div>
        ))}
      </div>
      <div className="bg-white/8 rounded-xl p-3.5 h-32 relative">
        <div className="text-[11px] opacity-80 mb-2">Utilização — últimos 6 meses</div>
        <svg viewBox="0 0 240 60" preserveAspectRatio="none" className="w-full h-20">
          <defs>
            <linearGradient id="grad-emp" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#e85d1f" stopOpacity=".5" />
              <stop offset="100%" stopColor="#e85d1f" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,40 L40,32 L80,38 L120,22 L160,28 L200,14 L240,18 L240,60 L0,60 Z"
            fill="url(#grad-emp)"
            className="animate-fade-in"
            style={{ opacity: 0 }}
          />
          <path
            d="M0,40 L40,32 L80,38 L120,22 L160,28 L200,14 L240,18"
            fill="none"
            stroke="#e85d1f"
            strokeWidth="2.5"
            strokeDasharray="400"
            strokeDashoffset="400"
            className="animate-draw"
          />
        </svg>
      </div>
    </div>
  );
}

function PhoneMock() {
  return (
    <div className="w-[240px] mx-auto bg-white text-ink rounded-[28px] p-3.5" style={{ boxShadow: 'var(--shadow-lg)' }}>
      <div className="flex justify-between text-[10px] px-2 pb-2 text-muted">
        <span>9:41</span>
        <span>●●● 5G</span>
      </div>
      <div className="px-1.5 pb-3.5">
        <div className="text-[11px] text-muted">Olá, Rafael 👋</div>
        <div className="text-[17px] font-bold tracking-[-0.01em]">Como você está hoje?</div>
      </div>
      <div
        className="rounded-2xl p-3.5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d6b6b, #1c9b96)' }}
      >
        <div className="text-[10px] opacity-80 tracking-[0.12em]">CARTEIRINHA DIGITAL</div>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white" className="absolute right-2.5 top-2.5 opacity-35">
          <rect x="3" y="6" width="18" height="13" rx="2" />
        </svg>
        <div className="font-bold mt-3.5 text-[13px]">Rafael Andrade Silva</div>
        <div className="font-mono text-[11px] opacity-85">0420 8814 9072 · Plano Plus</div>
      </div>
      <div className="grid grid-cols-4 gap-1.5 mt-3.5">
        {[
          { Icon: Search, label: 'Buscar' },
          { Icon: Calendar, label: 'Agenda' },
          { Icon: FileText, label: 'Histórico' },
          { Icon: MessageCircle, label: 'Chat' },
        ].map(({ Icon, label }) => (
          <div key={label} className="bg-bg-warm rounded-[10px] py-2.5 px-1 text-center text-[9px] font-semibold">
            <div className="w-[22px] h-[22px] mx-auto mb-1.5 text-teal-700">
              <Icon size={22} />
            </div>
            {label}
          </div>
        ))}
      </div>
      <div className="mt-3.5 pt-3.5 border-t border-line">
        <div className="text-[10px] text-muted uppercase tracking-[0.1em] font-bold">Perto de você</div>
        <div className="flex items-center gap-2.5 mt-2.5 p-2 rounded-[10px] bg-bg-warm">
          <div className="w-7 h-7 rounded-full bg-teal-50 grid place-items-center text-teal-700">
            <Heart size={14} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold">Clínica Vivara</div>
            <div className="text-[10px] text-muted">Cardiologia · 4.9 ★</div>
          </div>
          <div className="ml-auto text-[10px] text-orange-500 font-bold">1,2km</div>
        </div>
      </div>
    </div>
  );
}

function AgendaMock() {
  const slots = [
    { time: '15:30', name: 'Maria H. Costa', desc: 'Consulta cardio', state: 'next' },
    { time: '16:00', name: 'João Silva', desc: 'Retorno', state: 'wait' },
    { time: '16:30', name: 'Ana Beatriz', desc: 'Primeira consulta', state: 'wait' },
    { time: '17:00', name: 'Pedro Almeida', desc: 'Exame', state: 'wait' },
  ];
  return (
    <div>
      <div className="flex justify-between items-center mb-3.5">
        <span className="text-[13px] opacity-85 tracking-[0.04em]">Agenda · Hoje</span>
        <span className="text-[12px] bg-white/10 px-3 py-1.5 rounded-full">Seg, 26 abr</span>
      </div>
      <div className="bg-white/6 rounded-2xl p-3 backdrop-blur-md">
        {slots.map((slot, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-2.5 rounded-[10px] transition-colors ${
              slot.state === 'next'
                ? 'bg-orange-500/20 border border-orange-500/40'
                : 'hover:bg-white/8'
            }`}
          >
            <div className="font-mono text-xs font-bold opacity-90 min-w-[50px]">{slot.time}</div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold">{slot.name}</div>
              <div className="text-[11px] opacity-70">{slot.desc}</div>
            </div>
            <span
              className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                slot.state === 'next'
                  ? 'bg-mint-bright/20 text-mint-bright'
                  : 'bg-yellow-400/20 text-yellow-300'
              }`}
            >
              {slot.state === 'next' ? 'Próximo' : 'Aguardando'}
            </span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2.5 mt-3.5">
        {[
          { l: 'Hoje', v: '12' },
          { l: 'Semana', v: '68' },
          { l: 'A receber', v: 'R$ 8,4k' },
        ].map((t) => (
          <div key={t.l} className="bg-white/8 rounded-xl p-3">
            <div className="text-[10px] opacity-75 tracking-[0.05em] uppercase font-semibold">{t.l}</div>
            <div className="text-[22px] font-extrabold tracking-[-0.02em] mt-1">{t.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
