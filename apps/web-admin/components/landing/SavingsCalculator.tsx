'use client';

import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { CONTACT_HREF } from '../../lib/urls';

const BENEFITS = [
  'Mensalidade fixa, sem reajustes anuais surpresa',
  'Sem coparticipação escondida',
  'Rede de clínicas e especialistas com cobertura nacional',
  'Suporte humano dedicado para o RH',
];

function fmt(n: number) {
  return Math.round(n).toLocaleString('pt-BR');
}

export default function SavingsCalculator() {
  const [emp, setEmp] = useState(25);
  const [cost, setCost] = useState(450);

  const { aci, monthlySave, yearSave } = useMemo(() => {
    const aci = Math.max(89, Math.round((cost * 0.3) / 5) * 5);
    const monthlySave = (cost - aci) * emp;
    return { aci, monthlySave, yearSave: monthlySave * 12 };
  }, [emp, cost]);

  const empPct = ((emp - 5) / (500 - 5)) * 100;
  const costPct = ((cost - 200) / (1500 - 200)) * 100;

  return (
    <section
      id="economia"
      className="py-[110px]"
      style={{
        background:
          'radial-gradient(80% 70% at 0% 0%, rgba(232,93,31,.06), transparent 60%), #f7f5f1',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-7 grid lg:grid-cols-[1.05fr_.95fr] gap-15 items-center">
        {/* Text side */}
        <div>
          <span className="inline-flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-[0.18em]">
            <span className="w-6 h-0.5 bg-orange-500" />
            A conta que importa
          </span>
          <h2 className="text-[clamp(34px,4vw,50px)] leading-[1.05] tracking-[-0.025em] font-extrabold mt-3.5 mb-4">
            Cuide da equipe gastando{' '}
            <em className="not-italic text-orange-500 relative inline-block">
              70% menos.
              <span
                className="absolute left-0 right-0 -bottom-1 h-2 rounded-sm -z-10"
                style={{ background: 'rgba(232,93,31,.18)' }}
              />
            </em>
          </h2>
          <p className="text-muted text-[17px] mb-6">
            Planos convencionais cobram caro pelo &ldquo;porque sim&rdquo;. Aqui você paga só pelo que realmente
            entrega valor — e a sua equipe ganha acesso de verdade.
          </p>
          <ul className="list-none p-0 mb-7 space-y-1">
            {BENEFITS.map((b) => (
              <li key={b} className="flex gap-3 items-center py-2 text-[15px] text-ink-2">
                <span className="w-[22px] h-[22px] rounded-full bg-teal-50 text-teal-700 grid place-items-center shrink-0">
                  <Check size={12} strokeWidth={3} />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <a
            href={CONTACT_HREF}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm bg-ink text-white transition-colors hover:bg-[#1a2b39]"
          >
            Ver tabela completa <span>→</span>
          </a>
        </div>

        {/* Calculator card */}
        <div className="bg-white rounded-3xl p-8 border border-line" style={{ boxShadow: 'var(--shadow-md)' }}>
          <h4 className="m-0 mb-1.5 text-sm font-bold tracking-[0.04em] uppercase text-teal-800">
            Calcule sua economia
          </h4>
          <p className="text-muted text-sm m-0 mb-6">
            Mexa nos sliders e veja quanto sua empresa pode economizar.
          </p>

          {/* emp slider */}
          <div className="mb-6">
            <label className="flex justify-between items-center text-[13px] font-semibold text-ink-2 mb-2.5">
              <span>Quantos colaboradores?</span>
              <span className="text-[18px] font-extrabold text-orange-500 tracking-[-0.02em]">{emp}</span>
            </label>
            <input
              type="range"
              min={5}
              max={500}
              step={1}
              value={emp}
              onChange={(e) => setEmp(Number(e.target.value))}
              className="calc-range"
              style={{ '--p': `${empPct}%` } as React.CSSProperties}
            />
          </div>

          {/* cost slider */}
          <div className="mb-6">
            <label className="flex justify-between items-center text-[13px] font-semibold text-ink-2 mb-2.5">
              <span>Investimento atual / colab.</span>
              <span className="text-[18px] font-extrabold text-orange-500 tracking-[-0.02em]">
                R$ {cost.toLocaleString('pt-BR')}
              </span>
            </label>
            <input
              type="range"
              min={200}
              max={1500}
              step={10}
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              className="calc-range"
              style={{ '--p': `${costPct}%` } as React.CSSProperties}
            />
          </div>

          {/* Result */}
          <div
            className="mt-7 p-6 rounded-2xl text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #08494a, #14807e)' }}
          >
            <div
              className="absolute -right-10 -top-10 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(232,93,31,.3), transparent 70%)' }}
            />
            <div className="relative z-10">
              <div className="text-[12px] opacity-80 tracking-[0.12em] uppercase font-bold">
                Você pode economizar até
              </div>
              <div className="text-[44px] font-extrabold tracking-[-0.03em] mt-1.5 leading-none">
                R$ {fmt(monthlySave)}
                <span className="text-[18px] opacity-80 font-semibold">/mês</span>
              </div>
              <div className="text-[13px] opacity-85 mt-2.5">
                Com a ACI Saúde a R$ {aci} por colaborador.
              </div>
              <div className="mt-3.5 pt-3.5 border-t border-white/20 flex justify-between text-[13px]">
                <span>Economia anual</span>
                <span className="text-mint-bright font-bold">R$ {fmt(yearSave)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
