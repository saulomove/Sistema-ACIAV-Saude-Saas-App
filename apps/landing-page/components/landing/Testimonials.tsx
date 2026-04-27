import { Star } from 'lucide-react';
import { TESTIMONIALS } from '../../lib/landing-data';

export default function Testimonials() {
  return (
    <section id="depoimentos" className="bg-white py-[110px]">
      <div className="max-w-[1200px] mx-auto px-7">
        <div className="text-center max-w-[720px] mx-auto mb-15">
          <span className="inline-flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-[0.18em]">
            <span className="w-6 h-0.5 bg-orange-500" />
            Quem usa, recomenda
          </span>
          <h2 className="text-[clamp(34px,3.8vw,50px)] leading-[1.05] tracking-[-0.025em] font-extrabold mt-3.5 mb-4 text-ink">
            Empresas que <span className="font-serif">trocaram</span> e não voltariam.
          </h2>
          <p className="text-muted text-[17px]">
            Mais de 200 empresas confiam na ACI Saúde para cuidar das suas equipes todos os dias.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="relative p-7 rounded-[20px] bg-white border border-line transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-transparent"
            >
              <span
                className="absolute top-3.5 right-5 font-serif text-[50px] leading-none text-orange-500 opacity-50 select-none"
                aria-hidden="true"
              >
                &ldquo;
              </span>
              <div className="flex gap-0.5 mb-3.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" stroke="none" />
                ))}
              </div>
              <p className="text-[15px] text-ink-2 leading-[1.55] mb-5.5">{t.quote}</p>
              <div className="flex items-center gap-3 pt-4 border-t border-line">
                <div
                  className="w-11 h-11 rounded-full grid place-items-center text-white font-extrabold text-sm"
                  style={{ background: t.gradient }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-bold">{t.name}</div>
                  <div className="text-xs text-muted">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
