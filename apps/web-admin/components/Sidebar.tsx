'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Building, Stethoscope, FileText, Settings, Award, LogOut } from 'lucide-react';
import Image from 'next/image';
import clsx from 'clsx';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    async function handleLogout() {
        await fetch('/internal/logout', { method: 'POST' });
        router.push('/login');
    }

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
        { name: 'Unidades', icon: Building, href: '/unidades' },
        { name: 'Empresas (RH)', icon: Users, href: '/empresas' },
        { name: 'Credenciados', icon: Stethoscope, href: '/credenciados' },
        { name: 'Beneficiários', icon: FileText, href: '/beneficiarios' },
        { name: 'Gamificação', icon: Award, href: '/premios' },
        { name: 'Configurações', icon: Settings, href: '/configuracoes' },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-100 flex flex-col min-h-screen sticky top-0 shadow-sm overflow-hidden z-20">
            {/* Brand */}
            <div className="h-20 flex items-center justify-center border-b border-gray-100 bg-white">
                <div className="w-40 relative h-12">
                    <Image
                        src="/logo-aciav-saude.png"
                        alt="ACIAV Saúde"
                        fill
                        className="object-contain object-center"
                        priority
                    />
                </div>
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
                                    ? "bg-primary/5 text-primary shadow-sm"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                            )}
                        >
                            <Icon size={20} className={isActive ? "text-primary" : "text-slate-400"} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-gray-100 bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shadow-sm">
                        SM
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800">Saulo Machado</p>
                        <p className="text-xs text-slate-500">Super Admin</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium"
                >
                    <LogOut size={16} />
                    Sair
                </button>
            </div>
        </aside>
    );
}
