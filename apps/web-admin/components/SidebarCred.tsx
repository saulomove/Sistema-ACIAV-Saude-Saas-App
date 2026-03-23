'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Stethoscope, Clock, ShieldCheck, Gift, Settings, LogOut, ArrowLeftRight } from 'lucide-react';
import Image from 'next/image';
import clsx from 'clsx';

export default function SidebarCred() {
    const pathname = usePathname();

    const menuItems = [
        { name: 'Novo Atendimento', icon: ShieldCheck, href: '/portal-credenciado' },
        { name: 'Meus Serviços', icon: Stethoscope, href: '/portal-credenciado/servicos' },
        { name: 'Histórico & Faturamento', icon: Clock, href: '/portal-credenciado/historico' },
        { name: 'Gamificação (Dar Pontos)', icon: Gift, href: '/portal-credenciado/gamificacao' },
        { name: 'Configurações', icon: Settings, href: '/portal-credenciado/configuracoes' },
    ];

    return (
        <aside className="w-64 bg-[#007178] text-white flex flex-col min-h-screen sticky top-0 shadow-xl overflow-hidden z-20">
            {/* Brand */}
            <div className="h-24 flex flex-col items-center justify-center border-b border-gray-100 bg-white pt-4 pb-2 shrink-0">
                <div className="w-40 relative h-10 mb-1">
                    <Image
                        src="/logo-aciav-saude.png"
                        alt="ACIAV Saúde"
                        fill
                        className="object-contain object-center"
                        priority
                    />
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Portal do Parceiro</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-2 mt-4">
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
                                    ? "bg-white text-primary-900 shadow-md transform scale-[1.02]"
                                    : "text-white/70 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <Icon size={20} className={isActive ? "text-primary-700" : "text-white/50"} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Switcher Demo */}
            <div className="p-4 border-t border-primary-800 space-y-3">
                <Link href="/" className="flex items-center gap-2 text-xs text-emerald-300 hover:text-white transition-colors bg-emerald-950 p-3 rounded-lg w-full">
                    <ArrowLeftRight size={14} /> Voltar para Painel ACIAV (Demo)
                </Link>
                <button className="flex items-center gap-2 text-xs text-red-300 hover:text-red-200 transition-colors w-full px-2 font-bold">
                    <LogOut size={14} /> Sair da Plataforma
                </button>
            </div>
        </aside>
    );
}
