'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Stethoscope, Clock, ShieldCheck, Gift, LogOut, Wrench } from 'lucide-react';
import Image from 'next/image';
import clsx from 'clsx';

const menuItems = [
  { name: 'Atendimento', icon: ShieldCheck, href: '/portal-credenciado' },
  { name: 'Meus Serviços', icon: Wrench, href: '/portal-credenciado/servicos' },
  { name: 'Histórico', icon: Clock, href: '/portal-credenciado/historico' },
  { name: 'Gamificação', icon: Gift, href: '/portal-credenciado/gamificacao' },
];

export default function SidebarCred({
  providerId,
  providerName,
  providerCategory,
}: {
  providerId: string;
  providerName: string;
  providerCategory: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/internal/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <aside className="w-64 bg-[#007178] text-white flex flex-col min-h-screen sticky top-0 shadow-xl overflow-hidden z-20">
      {/* Brand */}
      <div className="h-24 flex flex-col items-center justify-center border-b border-gray-100 bg-white pt-4 pb-2 shrink-0">
        <div className="w-40 relative h-10 mb-1">
          <Image src="/logo-aciav-saude.png" alt="ACIAV Saúde" fill className="object-contain object-center" priority />
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Portal do Parceiro</p>
      </div>

      {/* Provider info */}
      <div className="px-4 py-3 bg-black/20 border-b border-white/10">
        <p className="text-xs text-white/60 font-medium">{providerCategory}</p>
        <p className="text-sm font-bold text-white truncate">{providerName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 mt-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/portal-credenciado' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium',
                isActive ? 'bg-white text-[#007178] shadow-md' : 'text-white/70 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon size={20} className={isActive ? 'text-[#007178]' : 'text-white/50'} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-red-300 hover:text-red-200 transition-colors w-full px-2 py-2 font-bold"
        >
          <LogOut size={14} /> Sair da Plataforma
        </button>
      </div>
    </aside>
  );
}
