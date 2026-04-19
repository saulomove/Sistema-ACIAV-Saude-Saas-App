'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Clock, LogOut, Wrench, Menu, X, Settings, LayoutDashboard, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import clsx from 'clsx';
import { useState } from 'react';

const menuItems = [
  { name: 'Painel', icon: LayoutDashboard, href: '/portal-credenciado' },
  { name: 'Meus Serviços', icon: Wrench, href: '/portal-credenciado/servicos' },
  { name: 'Histórico', icon: Clock, href: '/portal-credenciado/historico' },
  { name: 'Configurações', icon: Settings, href: '/portal-credenciado/configuracoes' },
];

function whatsLink(raw?: string | null) {
  const d = (raw || '').replace(/\D/g, '');
  return d ? `https://wa.me/55${d}?text=${encodeURIComponent('Olá, preciso de suporte no portal do credenciado.')}` : null;
}

export default function SidebarCred({
  providerName,
  providerCategory,
  supportWhatsapp,
}: {
  providerId: string;
  providerName: string;
  providerCategory: string;
  supportWhatsapp?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  async function handleLogout() {
    await fetch('/internal/logout', { method: 'POST' });
    router.push('/login');
  }

  const supportHref = whatsLink(supportWhatsapp);

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
      'w-64 bg-[#007178] text-white flex flex-col min-h-screen shadow-xl overflow-hidden z-50',
      'fixed inset-y-0 left-0 transition-transform duration-300',
      'md:static md:translate-x-0 md:z-20 md:shrink-0',
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
    )}>
      {/* Brand */}
      <div className="h-24 flex flex-col items-center justify-center border-b border-gray-100 bg-white pt-4 pb-2 shrink-0 relative">
        <Image src="/logo-aciav-saude.png" alt="ACIAV Saúde" width={160} height={40} className="object-contain" priority />
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Portal do Parceiro</p>
        <button
          className="md:hidden absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-700"
          onClick={() => setIsOpen(false)}
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
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
      <div className="p-4 border-t border-white/20 space-y-3">
        {supportHref && (
          <a
            href={supportHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-white bg-emerald-500/90 hover:bg-emerald-500 transition-colors w-full px-3 py-2.5 rounded-xl font-bold"
          >
            <MessageCircle size={14} /> Suporte via WhatsApp
          </a>
        )}
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
