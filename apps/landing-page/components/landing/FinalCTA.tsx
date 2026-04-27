import { Check } from 'lucide-react';
import { CONTACT_HREF } from '../../lib/urls';

export default function FinalCTA() {
  return (
    <section
      id="contato"
      className="text-white py-[110px] relative overflow-hidden"
      style={{
        background:
          'radial-gradient(60% 80% at 70% 50%, rgba(255,255,255,.12), transparent 60%), linear-gradient(135deg, #e85d1f 0%, #f57b3e 100%)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 70%)',
        }}
      />
      <div className="max-w-[1200px] mx-auto px-7 relative z-10 grid lg:grid-cols-[1.1fr_.9fr] gap-10 items-center">
        <div className="text-center lg:text-left">
          <span
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-semibold uppercase tracking-[0.14em] text-white"
            style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-mint-bright animate-pulse-dot" />
            Vagas limitadas neste mês
          </span>
          <h2 className="mt-4 text-[clamp(38px,4.6vw,60px)] leading-[1.02] tracking-[-0.025em] font-extrabold mb-4">
            Sua equipe merece mais.
            <br />E sua empresa pode pagar menos.
          </h2>
          <p className="text-[18px] opacity-90 mb-7 max-w-[480px] mx-auto lg:mx-0">
            Solicite uma demonstração gratuita e descubra em 15 minutos quanto sua empresa pode economizar com a
            ACI Saúde.
          </p>
          <div className="flex flex-wrap gap-3.5 justify-center lg:justify-start">
            <a
              href={CONTACT_HREF}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-semibold text-[15px] bg-white text-orange-500 transition-transform hover:-translate-y-0.5"
            >
              Solicitar demonstração <span>→</span>
            </a>
            <a
              href={CONTACT_HREF}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-full font-semibold text-[15px] bg-transparent text-white border border-white/50 transition-colors hover:bg-white/10"
            >
              Falar pelo WhatsApp
            </a>
          </div>
        </div>

        <div
          className="bg-white text-ink rounded-[22px] p-7"
          style={{
            boxShadow: 'var(--shadow-lg)',
            transform: 'rotate(-1.5deg)',
          }}
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-500 text-[11px] font-bold tracking-[0.12em] uppercase">
            Garantia ACI
          </span>
          <h3 className="text-2xl font-extrabold tracking-[-0.02em] mt-3.5 mb-2.5">30 dias para experimentar.</h3>
          <p className="text-muted text-sm m-0">
            Não gostou nos primeiros 30 dias? Cancela sem multa, sem perguntas. A gente confia tanto que assume
            o risco junto.
          </p>
          <ul className="list-none p-0 m-0 mt-3.5 space-y-1">
            {[
              'Ativação em 48 horas',
              'Suporte humano dedicado',
              'Sem fidelidade obrigatória',
            ].map((item) => (
              <li key={item} className="flex gap-2.5 py-2.5 items-center text-sm">
                <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 grid place-items-center shrink-0">
                  <Check size={14} strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
