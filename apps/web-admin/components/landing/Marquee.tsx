import { TRUSTED_COMPANIES } from '../../lib/landing-data';

const SHAPES = [
  // circle
  <svg key="c" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-85">
    <circle cx="12" cy="12" r="10" />
  </svg>,
  // square
  <svg key="s" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-85">
    <rect x="3" y="3" width="18" height="18" rx="3" />
  </svg>,
  // triangle
  <svg key="t" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-85">
    <polygon points="12 2 22 22 2 22" />
  </svg>,
];

export default function Marquee() {
  // Render the list twice for a seamless loop
  const items = [...TRUSTED_COMPANIES, ...TRUSTED_COMPANIES];

  return (
    <div
      className="py-6 border-t border-b border-white/10"
      style={{
        background: 'linear-gradient(180deg, #0d6b6b 0%, #0a5d5e 100%)',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-7">
        <div className="text-white/55 text-[11px] uppercase tracking-[0.18em] text-center mb-4 font-semibold">
          Confiam na ACI Saúde
        </div>
      </div>
      <div className="flex gap-16 animate-marquee whitespace-nowrap will-change-transform">
        {items.map((company, i) => (
          <div
            key={`${company}-${i}`}
            className="text-white/85 font-bold text-[18px] tracking-[-0.01em] flex items-center gap-2.5 shrink-0"
          >
            {SHAPES[i % SHAPES.length]}
            <span>{company}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
