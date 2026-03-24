import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'ACIAV Saúde | Rede de Convênios',
    description: 'A maior rede de convênios de saúde e benefícios corporativos',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR" className="scroll-smooth">
            <body className={inter.className}>
                <header className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100 transition-all">
                    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Image
                                src="/logo-aciav-saude.png"
                                alt="ACIAV Saúde"
                                width={128}
                                height={40}
                                className="object-contain"
                                priority
                            />
                        </div>
                        <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
                            <a href="#o-projeto" className="hover:text-brand-primary transition-colors">O Projeto</a>
                            <a href="#credenciados" className="hover:text-brand-primary transition-colors">Credenciados</a>
                            <a href="#empresas" className="hover:text-brand-primary transition-colors">Para Empresas</a>
                        </nav>
                        <div className="flex items-center gap-4">
                            <a href="http://localhost:3000/login" className="text-sm font-medium text-brand-primary hover:text-brand-primary-dark transition-colors">Entrar</a>
                            <a href="#contato" className="bg-brand-secondary hover:bg-[#c44400] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                                Saiba Mais
                            </a>
                        </div>
                    </div>
                </header>

                <main className="pt-20">
                    {children}
                </main>
            </body>
        </html>
    );
}
