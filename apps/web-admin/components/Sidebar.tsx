'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Building, Stethoscope, FileText, Settings,
  Award, LogOut, Globe, DollarSign, ShieldCheck, BarChart3,
} from 'lucide-react';
import Image from 'next/image';
import clsx from 'clsx';

interface MenuItem { name: string; icon: React.ElementType; href: string; }

function getMenuItems(role: string): MenuItem[] {
  switch (role) {
    case 'super_admin':
      return [
        { name: 'Dashboard Global', icon: LayoutDashboard, href: '/' },
        { name: 'Unidades', icon: Globe, href: '/unidades' },
        { name: 'Usuários Admin', icon: ShieldCheck, href: '/admin-users' },
        { name: 'Faturamento', icon: DollarSign, href: '/faturamento' },
        { name: 'Configurações', icon: Settings, href: '/configuracoes' },
      ];
    case 'admin_unit':
      return [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
        { name: 'Beneficiários', icon: Users, href: '/beneficiarios' },
        { name: 'Empresas (RH)', icon: Building, href: '/empresas' },
        { name: 'Credenciados', icon: Stethoscope, href: '/credenciados' },
        { name: 'Relatórios', icon: BarChart3, href: '/relatorios' },
        { name: 'Gamificação', icon: Award, href: '/premios' },
        { name: 'Configurações', icon: Settings, href: '/configuracoes' },
      ];
    default:
      return [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
        { name: 'Beneficiários', icon: FileText, href: '/beneficiarios' },
        { name: 'Empresas (RH)', icon: Building, href: '/empresas' },
        { name: 'Credenciados', icon: Stethoscope, href: '/credenciados' },
        { name: 'Configurações', icon: Settings, href: '/configuracoes' },
      ];
  }
}

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin_unit: 'Admin Unidade',
    rh: 'Recursos Humanos',
    provider: 'Credenciado',
    patient: 'Beneficiário',
  };
  return labels[role] ?? role;
}

function initials(email: string): string {
  const parts = email.split('@')[0].split(/[._-]/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}

export default function Sidebar({
  role,
  email,
  unitName,
}: {
  role: string;
  email: string;
  unitName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/internal/logout', { method: 'POST' });
    router.push('/login');
  }

  const menuItems = getMenuItems(role);

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

      {/* Role Badge */}
      <div className="px-4 pt-4 pb-2">
        <div className={clsx(
          'px-3 py-1.5 rounded-lg text-xs font-bold text-center',
          role === 'super_admin'
            ? 'bg-secondary/10 text-secondary'
            : 'bg-primary/10 text-primary'
        )}>
          {role === 'super_admin' ? '🔑 ' : ''}{roleLabel(role)}
          {role !== 'super_admin' && unitName && (
            <span className="block text-[10px] font-medium opacity-70 mt-0.5">{unitName}</span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out font-medium text-sm',
                isActive
                  ? 'bg-primary/5 text-primary shadow-sm border border-primary/10'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
              )}
            >
              <Icon size={19} className={isActive ? 'text-primary' : 'text-slate-400'} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 bg-slate-50/50 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
            {initials(email) || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{email.split('@')[0]}</p>
            <p className="text-xs text-slate-500 truncate">{email}</p>
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
