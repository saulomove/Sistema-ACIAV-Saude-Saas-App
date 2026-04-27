import Image from 'next/image';
import { FOOTER_GROUPS } from '../../lib/landing-data';

export default function Footer() {
  return (
    <footer className="text-white/70 text-sm pt-[70px] pb-[30px]" style={{ background: 'var(--color-ink)' }}>
      <div className="max-w-[1200px] mx-auto px-7">
        <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 mb-12">
          <div>
            <a
              href="#"
              aria-label="ACI Saúde"
              className="inline-flex bg-white px-3.5 py-2 rounded-[10px]"
            >
              <Image
                src="/logo-aciav-saude.png"
                alt="ACI Saúde"
                width={160}
                height={32}
                className="h-8 w-auto object-contain"
              />
            </a>
            <p className="text-white/60 mt-4.5 leading-[1.6] max-w-[320px]">
              Saúde corporativa acessível, moderna e sem burocracia. Conectamos empresas, colaboradores e
              clínicas em uma só rede.
            </p>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h5 className="text-white text-[13px] tracking-[0.12em] uppercase mb-4 font-semibold">
                {group.title}
              </h5>
              <ul className="list-none p-0 m-0">
                {group.links.map((link) => (
                  <li key={link.label} className="py-1.5">
                    <a href={link.href} className="transition-colors hover:text-orange-500">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-wrap justify-between gap-3 text-white/50 text-[13px]">
          <span>
            © {new Date().getFullYear()} ACIAV Saúde — Todos os direitos reservados. Feito com{' '}
            <span className="inline-block animate-heartbeat origin-center" aria-label="amor">
              ❤️
            </span>{' '}
            pela Agência ArtDesign
          </span>
        </div>
      </div>
    </footer>
  );
}
