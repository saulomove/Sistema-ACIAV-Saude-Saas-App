import { Smartphone } from 'lucide-react';
import { GooglePlayBadge, AppStoreSoonBadge } from './AppBadges';

export default function AppDownload() {
  return (
    <section id="app" className="bg-bg-warm py-[80px]">
      <div className="mx-auto max-w-[1200px] px-7">
        <div
          className="relative overflow-hidden rounded-[28px] px-8 py-12 text-center text-white md:px-14"
          style={{
            background:
              'radial-gradient(70% 90% at 80% 0%, rgba(28,155,150,.5) 0%, transparent 60%), linear-gradient(135deg, #08494a 0%, #0d6b6b 100%)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
              backgroundSize: '54px 54px',
              maskImage: 'radial-gradient(ellipse 70% 70% at 50% 30%, black 30%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 30%, black 30%, transparent 80%)',
            }}
          />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em]">
              <Smartphone size={14} /> App do beneficiário
            </span>
            <h2 className="mx-auto mt-4 mb-3 max-w-[640px] text-[clamp(30px,4vw,46px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
              Já é beneficiário? Leve tudo no bolso.
            </h2>
            <p className="mx-auto mb-8 max-w-[560px] text-[18px] leading-[1.5] text-white/80">
              Sua carteirinha digital, a rede credenciada e o histórico de economia — no seu celular, a qualquer
              hora.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <GooglePlayBadge />
              <AppStoreSoonBadge />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
