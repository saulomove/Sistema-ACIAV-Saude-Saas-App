'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, UserPlus, FileSpreadsheet, ActivitySquare, LogOut } from 'lucide-react';
import Image from 'next/image';
import clsx from 'clsx';
import { api } from '../lib/api-client';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/portal-rh' },
  { name: 'Colaboradores', icon: Users, href: '/portal-rh/colaboradores' },
  { name: 'Dependentes', icon: UserPlus, href: '/portal-rh/dependentes' },
  { name: 'Importar Planilha', icon: FileSpreadsheet, href: '/portal-rh/importar' },
  { name: 'Relatórios', icon: ActivitySquare, href: '/portal-rh/relatorios' },
];

export default function SidebarRH({ email, companyName }: { email: string; companyName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try { await api.post('/auth/logout', {}); } catch { /* ignore */ }
    router.push('/login');
  }

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen sticky top-0 shadow-xl overflow-hidden z-20">
      {/* Brand */}
      <div className="h-24 flex flex-col items-center justify-center border-b border-gray-100 bg-white pt-4 pb-2 shrink-0">
        <div className="w-40 relative h-10 mb-1">
          <Image src="/logo-aciav-saude.png" alt="ACIAV Saúde" fill className="object-contain object-center" priority />
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Portal do RH</p>
      </div>

      {/* Company info */}
      <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700">
        <p className="text-xs text-slate-400 font-medium">Empresa</p>
        <p className="text-sm font-bold text-white truncate">{companyName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 mt-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/portal-rh' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium',
                isActive
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-white/50'} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="text-xs text-slate-400 px-2 truncate">{email}</div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors w-full px-2 py-1 font-bold"
        >
          <LogOut size={14} /> Sair da Plataforma
        </button>
      </div>
    </aside>
  );
}
