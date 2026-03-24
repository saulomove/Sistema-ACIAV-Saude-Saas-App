import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../lib/server-api';
import SidebarPaciente from '../../components/SidebarPaciente';
import { Bell } from 'lucide-react';
import Image from 'next/image';

interface PatientCard {
  id: string;
  fullName: string;
  cpf: string;
  pointsBalance: number;
  company?: { corporateName: string };
}

function HeaderPaciente({ name, company }: { name: string; company: string }) {
  const initials = name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
      {/* Mobile logo */}
      <div className="md:hidden pl-10 flex items-center">
        <div className="w-28 h-8 relative">
          <Image src="/logo-aciav-saude.png" alt="ACIAV Saúde" fill className="object-contain object-left" priority />
        </div>
      </div>
      <div className="hidden md:block">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Portal do Paciente</p>
        {company && <p className="text-sm font-bold text-slate-600">{company}</p>}
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-[#007178] hover:bg-teal-50 rounded-full transition-all">
          <Bell size={20} />
        </button>
        <div className="h-8 w-px bg-gray-200 mx-2" />
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">{name}</p>
            <p className="text-xs text-slate-400">Beneficiário</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#007178] text-white flex items-center justify-center font-bold text-sm">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}

export default async function PacienteLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'patient') redirect('/login');

  const card = await serverFetch<PatientCard>(`/users/me/card`);
  const patientName = card?.fullName ?? user.email;
  const companyName = card?.company?.corporateName ?? '';

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarPaciente patientName={patientName} companyName={companyName} />
      <div className="flex flex-col flex-1 overflow-hidden w-full bg-[#f8f9fa]">
        <HeaderPaciente name={patientName} company={companyName} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
