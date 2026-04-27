'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Heart, Clock, MessageCircle } from 'lucide-react';
import QrCode from './QrCode';
import { CONTACT_HREF } from '../../lib/urls';

const SWAP_WORDS = ['amar', 'merecer', 'usar', 'aprovar'];

export default function Hero() {
  const [swap, setSwap] = useState(SWAP_WORDS[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const visualRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let idx = 0;
    const id = setInterval(() => {
      idx = (idx + 1) % SWAP_WORDS.length;
      setIsAnimating(true);
      setTimeout(() => {
        setSwap(SWAP_WORDS[idx]);
        setIsAnimating(false);
      }, 280);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const visual = visualRef.current;
    if (!visual) return;

    const onMove = (e: MouseEvent) => {
      const rect = visual.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const main = visual.querySelector<HTMLElement>('[data-device="main"]');
      const mini = visual.querySelector<HTMLElement>('[data-device="mini"]');
      const notif = visual.querySelector<HTMLElement>('[data-device="notif"]');
      if (main) main.style.transform = `translate(-50%,-50%) rotate(-2deg) translate(${x * -8}px, ${y * -8}px)`;
      if (mini) mini.style.transform = `translate(${x * -14}px, ${y * -14}px)`;
      if (notif) notif.style.transform = `translate(${x * -12}px, ${y * -12}px)`;
    };
    const onLeave = () => {
      const main = visual.querySelector<HTMLElement>('[data-device="main"]');
      const mini = visual.querySelector<HTMLElement>('[data-device="mini"]');
      const notif = visual.querySelector<HTMLElement>('[data-device="notif"]');
      if (main) main.style.transform = '';
      if (mini) mini.style.transform = '';
      if (notif) notif.style.transform = '';
    };

    visual.addEventListener('mousemove', onMove);
    visual.addEventListener('mouseleave', onLeave);
    return () => {
      visual.removeEventListener('mousemove', onMove);
      visual.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <section
      className="relative text-white overflow-hidden pt-20"
      style={{
        background:
          'radial-gradient(80% 60% at 80% 0%, rgba(28,155,150,.55) 0%, transparent 60%), radial-gradient(60% 60% at 10% 100%, rgba(232,93,31,.18) 0%, transparent 50%), linear-gradient(180deg, #08494a 0%, #0d6b6b 100%)',
      }}
    >
      {/* Subtle grid backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 80%)',
        }}
      />

      <div className="max-w-[1200px] mx-auto px-7 relative z-10">
        <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-10 lg:gap-15 items-center">
          {/* ===== Text ===== */}
          <div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/95">
              <span
                className="w-1.5 h-1.5 rounded-full bg-mint-bright animate-pulse-dot"
              />
              Plataforma SaaS de saúde corporativa
            </span>
            <h1 className="text-[clamp(40px,5.4vw,68px)] leading-[1.02] tracking-[-0.025em] font-extrabold my-5">
              O benefício de saúde
              <br />
              que sua equipe vai{' '}
              <span className="relative inline-block align-baseline">
                <span
                  className="inline-block bg-clip-text text-transparent transition-all duration-300"
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, #ffd394, #e85d1f 50%, #ffb37a)',
                    opacity: isAnimating ? 0 : 1,
                    transform: isAnimating ? 'translateY(-6px)' : 'translateY(0)',
                  }}
                >
                  {swap}
                </span>
                <svg
                  className="block w-full -mt-2 h-3.5 text-orange-500"
                  viewBox="0 0 200 10"
                  preserveAspectRatio="none"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M2 7 Q 50 1, 100 5 T 198 6">
                    <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.4s" begin=".6s" fill="freeze" />
                  </path>
                </svg>
              </span>
            </h1>
            <p className="text-[19px] leading-[1.5] text-white/80 max-w-[540px] mb-8">
              Conectamos empresas, colaboradores e clínicas em uma rede de saúde acessível, moderna e{' '}
              <strong className="text-white">sem burocracia</strong>. Economia de até 70% comparado a planos
              convencionais — sem carência, com cobertura nacional.
            </p>
            <div className="flex flex-wrap gap-3.5 items-center">
              <a
                href={CONTACT_HREF}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full font-semibold text-[15px] bg-orange-500 text-white transition-all duration-200 hover:bg-orange-600 hover:-translate-y-0.5 shadow-[0_8px_22px_-8px_rgba(232,93,31,.6)] hover:shadow-[0_12px_26px_-8px_rgba(232,93,31,.7)]"
              >
                Solicitar demonstração <span>→</span>
              </a>
              <a
                href="#economia"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full font-semibold text-[15px] bg-white/10 text-white border border-white/20 transition-colors hover:bg-white/15"
              >
                Calcular economia
              </a>
            </div>
            <div className="flex flex-wrap gap-7 mt-9 text-[13px] text-white/70">
              <span className="inline-flex items-center gap-2">
                <Check size={16} strokeWidth={3} className="text-mint-bright" />
                Sem carência
              </span>
              <span className="inline-flex items-center gap-2">
                <Check size={16} strokeWidth={3} className="text-mint-bright" />
                Sem burocracia
              </span>
              <span className="inline-flex items-center gap-2">
                <Check size={16} strokeWidth={3} className="text-mint-bright" />
                Ativação em 48h
              </span>
            </div>
          </div>

          {/* ===== Visual ===== */}
          <div ref={visualRef} className="relative h-[520px] hidden lg:block" aria-hidden="true">
            {/* Main device */}
            <div
              data-device="main"
              className="absolute left-1/2 top-1/2 w-[360px] rounded-[22px] bg-white text-ink p-4 px-[18px] pb-[18px] animate-float"
              style={{
                transform: 'translate(-50%, -50%) rotate(-2deg)',
                boxShadow: 'var(--shadow-lg)',
                willChange: 'transform',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-line" />
                  <span className="w-2 h-2 rounded-full bg-line" />
                  <span className="w-2 h-2 rounded-full bg-line" />
                </div>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full tracking-[0.08em]">
                  PORTAL EMPRESA
                </span>
              </div>

              {/* Carteirinha */}
              <div
                className="rounded-[14px] p-3.5 text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #08494a, #14807e)' }}
              >
                <div
                  className="absolute -right-8 -top-8 w-[120px] h-[120px] rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(255,255,255,.12), transparent 70%)' }}
                />
                <div className="flex items-center gap-1.5 text-[11px] opacity-85 font-bold tracking-[0.12em]">
                  ACI SAÚDE
                </div>
                <div className="text-[15px] font-bold mt-4 tracking-tight">Maria Helena Costa</div>
                <div className="font-mono text-[12px] opacity-80 mt-1">CARTÃO 0420 8814 9072</div>
                <div className="flex justify-between mt-3.5 text-[10px] opacity-80 uppercase tracking-[0.08em]">
                  <span>Plano Plus</span>
                  <span>Vitalício</span>
                </div>
                <div className="absolute right-3.5 bottom-3.5 w-[42px] h-[42px] bg-white rounded-md p-[3px]">
                  <QrCode />
                </div>
              </div>

              {/* Quick access */}
              <div className="mt-3.5 grid grid-cols-3 gap-2">
                {[
                  { Icon: Heart, label: 'Médicos' },
                  { Icon: Clock, label: 'Agenda' },
                  { Icon: MessageCircle, label: 'Suporte' },
                ].map(({ Icon, label }) => (
                  <div
                    key={label}
                    className="bg-bg-warm rounded-[10px] py-2.5 px-1.5 text-center text-[10px] font-semibold text-ink-2 transition-colors hover:bg-teal-50 hover:text-teal-800"
                  >
                    <div className="w-[22px] h-[22px] mx-auto mb-1.5 text-teal-700">
                      <Icon size={22} />
                    </div>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Mini economy card */}
            <div
              data-device="mini"
              className="absolute -right-2.5 top-7 w-[220px] rounded-[18px] p-3.5 text-white animate-float-simple"
              style={{
                background: 'linear-gradient(135deg, #e85d1f, #ff8246)',
                boxShadow: 'var(--shadow-lg)',
                willChange: 'transform',
              }}
            >
              <div className="text-[11px] opacity-90 font-semibold tracking-[0.06em] uppercase">
                Economia do mês
              </div>
              <div className="text-[32px] font-extrabold tracking-[-0.02em] mt-1">68%</div>
              <div className="text-[12px] opacity-90 mt-0.5">↓ R$ 2.840 vs. mês anterior</div>
              <div className="flex items-end gap-[3px] mt-3 h-7">
                {[30, 55, 40, 75, 60, 90].map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-sm animate-bar"
                    style={{
                      height: `${h}%`,
                      background:
                        i === 3 ? 'rgba(255,255,255,.85)' : i === 5 ? 'white' : 'rgba(255,255,255,.4)',
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Notification card */}
            <div
              data-device="notif"
              className="absolute -left-5 bottom-7 w-[250px] rounded-[16px] bg-white p-3 px-3.5 flex items-center gap-2.5 animate-float-simple"
              style={{ boxShadow: 'var(--shadow-lg)', willChange: 'transform' }}
            >
              <div
                className="w-[38px] h-[38px] rounded-full grid place-items-center text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #1aa37a, #14c98e)' }}
              >
                <Check size={18} strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-[12px] font-bold text-ink">Consulta confirmada</div>
                <div className="text-[11px] text-muted mt-0.5">Dra. Camila — Cardiologia, hoje 15:30</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
