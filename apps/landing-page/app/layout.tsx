import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Instrument_Serif } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ACI Saúde — Saúde corporativa que sua equipe vai amar',
  description:
    'Conectamos empresas, colaboradores e clínicas em uma rede de saúde acessível, moderna e sem burocracia. Economia de até 70%, sem carência, com cobertura nacional.',
  applicationName: 'ACI Saúde',
  keywords: ['saúde corporativa', 'plano de saúde', 'convênio empresarial', 'benefício corporativo', 'ACIAV'],
  openGraph: {
    title: 'ACI Saúde — Saúde corporativa que sua equipe vai amar',
    description:
      'Plataforma SaaS que conecta empresas, colaboradores e clínicas. Economia de até 70%, sem carência.',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} ${instrument.variable}`}>
      <body>{children}</body>
    </html>
  );
}
