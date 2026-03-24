import { Bell, Search, Globe } from 'lucide-react';
import Image from 'next/image';

export default function Header({ role, unitName }: { role: string; unitName: string }) {
  const isSuperAdmin = role === 'super_admin';

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile logo — shown only on mobile (hamburger occupies left corner) */}
        <div className="md:hidden pl-10 flex items-center">
          <Image src="/logo-aciav-saude.png" alt="ACIAV Saúde" width={112} height={32} className="object-contain" priority />
        </div>
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
          <input
            type="text"
            placeholder={isSuperAdmin ? 'Buscar unidades, usuários...' : 'Buscar clínicas, CPFs ou empresas...'}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-400 hover:text-secondary hover:bg-orange-50 rounded-full transition-all">
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full border-2 border-white" />
        </button>

        <div className="h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-2">
          {isSuperAdmin ? (
            <>
              <Globe size={16} className="text-secondary" />
              <span className="text-sm font-semibold text-secondary hidden sm:block">Painel Global</span>
              <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-xs font-bold rounded-full">SaaS</span>
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{unitName}</span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">UNIDADE</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
