'use client';

import { useEffect, useRef } from 'react';
import { STATS } from '../../lib/landing-data';

function fmt(n: number) {
  return n >= 1000 ? n.toLocaleString('pt-BR') : String(n);
}

export default function Stats() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const counters = Array.from(container.querySelectorAll<HTMLElement>('[data-counter]'));
    const stats = Array.from(container.querySelectorAll<HTMLElement>('[data-stat]'));

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in');
          const counter = entry.target.querySelector<HTMLElement>('[data-counter]');
          if (counter && !counter.dataset.done) {
            counter.dataset.done = '1';
            const target = Number(counter.dataset.target ?? 0);
            const dur = 1400;
            const t0 = performance.now();
            const tick = (now: number) => {
              const p = Math.min(1, (now - t0) / dur);
              const eased = 1 - Math.pow(1 - p, 3);
              const v = Math.round(eased * target);
              counter.textContent = fmt(v);
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.3 },
    );

    stats.forEach((s) => io.observe(s));
    // ensure counters initialise to 0 for visual consistency
    counters.forEach((c) => {
      if (!c.dataset.done) c.textContent = '0';
    });

    return () => io.disconnect();
  }, []);

  return (
    <section className="bg-white py-16 border-b border-line">
      <div ref={containerRef} className="max-w-[1200px] mx-auto px-7">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-left">
          {STATS.map((stat, i) => (
            <div key={stat.label} data-stat className={`reveal delay-${Math.min(i, 3)}`}>
              <div className="font-extrabold leading-none flex items-baseline gap-1 text-teal-800 text-[clamp(38px,4.4vw,56px)] tracking-[-0.03em]">
                <span data-counter data-target={stat.target}>0</span>
                <span className="text-[0.55em] text-orange-500">{stat.suffix}</span>
              </div>
              <div className="text-muted text-sm mt-2 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
