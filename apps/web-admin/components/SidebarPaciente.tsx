'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CreditCard, Search, ActivitySquare, Gift, Settings, LogOut, Users, Menu, X } from 'lucide-react';
import Image from 'next/image';
import clsx from 'clsx';
import { useState } from 'react';

const menuItems = [
  { name: 'Minha Carteirinha', icon: CreditCard, href: '/portal-paciente' },
  { name: 'Dependentes', icon: Users, href: '/portal-paciente/dependentes' },
  { name: 'Guia Médico', icon: Search, href: '/portal-paciente/guia' },
  { name: 'Meu Histórico de Uso', icon: ActivitySquare, href: '/portal-paciente/historico' },
  { name: 'Resgatar Prêmios', icon: Gift, href: '/portal-paciente/premios' },
  { name: 'Configurações', icon: Settings, href: '/portal-paciente/configuracoes' },
];

export default function SidebarPaciente({
  patientName = '',
  companyName = '',
}: {
  patientName?: string;
  companyName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  async function handleLogout() {
    await fetch('/internal/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white rounded-xl p-2 shadow-lg border border-gray-100"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu size={20} className="text-slate-700" />
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

    <aside className={clsx(
      'w-64 bg-slate-900 text-white flex flex-col min-h-screen shadow-xl overflow-hidden z-50',
      'fixed inset-y-0 left-0 transition-transform duration-300',
      'md:static md:translate-x-0 md:z-20 md:shrink-0',
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
    )}>
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#007178] rounded-full blur-3xl -mr-20 -mt-20 opacity-30 pointer-events-none" />

      {/* Brand */}
      <div className="h-24 flex flex-col items-center justify-center border-b border-gray-100 bg-white pt-4 pb-2 shrink-0 relative z-10">
        <div className="w-40 relative h-10 mb-1">
          <Image src="/logo-aciav-saude.png" alt="ACIAV Saúde" fill className="object-contain object-center" priority />
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Portal do Paciente</p>
        <button
          className="md:hidden absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-700"
          onClick={() => setIsOpen(false)}
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Patient info */}
      {patientName && (
        <div className="px-4 py-3 bg-black/20 border-b border-white/10 relative z-10">
          {companyName && <p className="text-xs text-white/60 font-medium truncate">{companyName}</p>}
          <p className="text-sm font-bold text-white truncate">{patientName}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 mt-2 relative z-10">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/portal-paciente' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium',
                isActive
                  ? 'bg-white text-[#007178] shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon size={20} className={isActive ? 'text-[#007178]' : 'text-white/50'} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/20 relative z-10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-red-300 hover:text-red-200 transition-colors w-full px-2 py-2 font-bold"
        >
          <LogOut size={14} /> Sair da Plataforma
        </button>
      </div>
    </aside>
    </>
  );
}
