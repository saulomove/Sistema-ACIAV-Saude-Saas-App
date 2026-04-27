'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NAV_LINKS } from '../../lib/landing-data';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md transition-colors duration-200 ${
        scrolled
          ? 'bg-white/90 border-b border-line'
          : 'bg-bg-warm/80 border-b border-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-7 h-[72px] flex items-center justify-between">
        <a href="#" aria-label="ACI Saúde" className="flex items-center gap-2.5">
          <Image
            src="/logo-aciav-saude.png"
            alt="ACI Saúde"
            width={150}
            height={38}
            className="h-[38px] w-auto object-contain"
            priority
          />
        </a>

        <nav className="hidden md:flex gap-7 text-sm font-medium text-ink-2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative py-1.5 transition-colors hover:text-orange-500 group"
            >
              {link.label}
              <span className="absolute left-1/2 bottom-0 w-0 h-0.5 -translate-x-1/2 bg-orange-500 transition-all duration-200 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold text-white bg-orange-500 transition-all duration-200 hover:bg-orange-600 hover:-translate-y-0.5 shadow-[0_8px_22px_-8px_rgba(232,93,31,.6)] hover:shadow-[0_12px_26px_-8px_rgba(232,93,31,.7)]"
          >
            Acessar Sistema
            <span>→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
