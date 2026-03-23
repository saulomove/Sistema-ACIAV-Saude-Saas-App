'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, Search, ActivitySquare, Gift, Settings, LogOut, ArrowLeftRight, Users } from 'lucide-react';
import Image from 'next/image';
import clsx from 'clsx';

export default function SidebarPaciente() {
    const pathname = usePathname();

    const menuItems = [
        { name: 'Minha Carteirinha', icon: CreditCard, href: '/portal-paciente' },
        { name: 'Dependentes', icon: Users, href: '/portal-paciente/dependentes' },
        { name: 'Guia Médico', icon: Search, href: '/portal-paciente/guia' },
        { name: 'Meu Histórico de Uso', icon: ActivitySquare, href: '/portal-paciente/historico' },
        { name: 'Resgatar Prêmios', icon: Gift, href: '/portal-paciente/premios' },
        { name: 'Configurações', icon: Settings, href: '/portal-paciente/configuracoes' },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen sticky top-0 shadow-xl overflow-hidden relative z-20">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary rounded-full blur-3xl -mr-20 -mt-20 opacity-30 pointer-events-none"></div>

            {/* Brand */}
            <div className="h-24 flex flex-col items-center justify-center border-b border-gray-100 bg-white pt-4 pb-2 shrink-0 relative z-10">
                <div className="w-40 relative h-10 mb-1">
                    <Image
                        src="/logo-aciav-saude.png"
                        alt="ACIAV Saúde"
                        fill
                        className="object-contain object-center"
                        priority
                    />
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Portal do Paciente</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-2 mt-4 relative z-10">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out font-medium",
                                isActive
                                    ? "bg-primary/20 text-primary border border-primary/30 shadow-sm"
                                    : "text-white/70 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <Icon size={20} className={isActive ? "text-primary" : "text-white/50"} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Switcher Demo */}
            <div className="p-4 border-t border-white/10 space-y-3 relative z-10">
                <Link href="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors bg-white/5 p-3 rounded-lg w-full">
                    <ArrowLeftRight size={14} /> Voltar para Painel ACIAV (Demo)
                </Link>
                <button className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors w-full px-2 font-bold">
                    <LogOut size={14} /> Sair da Plataforma
                </button>
            </div>
        </aside>
    );
}
