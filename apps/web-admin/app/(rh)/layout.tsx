import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../lib/server-api';
import SidebarRH from '../../components/SidebarRH';
import Image from 'next/image';

interface Company { id: string; corporateName: string; }

function HeaderRH({ email, companyName }: { email: string; companyName: string }) {
  const initials = email.slice(0, 2).toUpperCase();
  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
      {/* Mobile logo */}
      <div className="md:hidden pl-10 flex items-center">
        <div className="w-28 h-8 relative">
          <Image src="/logo-aciav-saude.png" alt="ACIAV Saúde" fill className="object-contain object-left" priority />
        </div>
      </div>
      <div className="hidden md:block">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Portal RH</p>
        <p className="text-sm font-bold text-slate-700">{companyName}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">{email}</p>
            <p className="text-xs text-slate-400">Analista de RH</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}

export default async function RHLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user || user.role !== 'rh') redirect('/login');

  let companyName = 'Empresa';
  if (user.companyId) {
    const company = await serverFetch<Company>(`/companies/${user.companyId}`);
    if (company) companyName = company.corporateName;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarRH email={user.email} companyName={companyName} />
      <div className="flex flex-col flex-1 overflow-hidden w-full bg-slate-50">
        <HeaderRH email={user.email} companyName={companyName} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
