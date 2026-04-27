import { MessageCircle, FileText, UserPlus, Heart } from 'lucide-react';
import { JOURNEY_STEPS } from '../../lib/landing-data';

const ICON_MAP = {
  message: MessageCircle,
  document: FileText,
  team: UserPlus,
  heart: Heart,
} as const;

export default function Journey() {
  return (
    <section id="como" className="bg-white py-[110px]">
      <div className="max-w-[1200px] mx-auto px-7">
        <div className="text-center max-w-[720px] mx-auto mb-15">
          <span className="inline-flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-[0.18em]">
            <span className="w-6 h-0.5 bg-orange-500" />
            Como funciona
          </span>
          <h2 className="text-[clamp(34px,3.8vw,50px)] leading-[1.05] tracking-[-0.025em] font-extrabold mt-3.5 mb-4 text-ink">
            Da contratação ao primeiro atendimento <span className="font-serif">em 48 horas.</span>
          </h2>
          <p className="text-muted text-[17px]">
            Sem carência, sem burocracia, sem aprovação prévia para o que importa.
          </p>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Connector line — only visible on desktop */}
          <div
            className="hidden lg:block absolute top-9 left-[8%] right-[8%] h-0.5 z-0 opacity-50"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, var(--color-teal-600) 0 8px, transparent 8px 16px)',
            }}
          />
          {JOURNEY_STEPS.map((step, i) => {
            const Icon = ICON_MAP[step.iconKey];
            return (
              <div key={step.title} className="relative z-10 text-center px-2">
                <div className="relative w-[72px] h-[72px] mx-auto mb-4 grid place-items-center rounded-full bg-white border-2 border-teal-50 text-teal-700 transition-transform duration-300 hover:scale-105 hover:bg-teal-50">
                  <Icon size={28} strokeWidth={1.8} />
                  <span
                    className="absolute -top-1.5 -right-1.5 w-[26px] h-[26px] rounded-full bg-orange-500 text-white text-xs font-extrabold grid place-items-center"
                    style={{ boxShadow: '0 4px 10px -2px rgba(232,93,31,.5)' }}
                  >
                    {i + 1}
                  </span>
                </div>
                <h4 className="text-[17px] font-bold mb-2 tracking-[-0.01em]">{step.title}</h4>
                <p className="text-muted text-sm leading-[1.55]">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
