import SidebarPaciente from '../../components/SidebarPaciente';
import { Bell, User } from 'lucide-react';

// Custom Header Paciente
function HeaderPaciente() {
    return (
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-end px-8 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-4">
                <button className="relative p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
                </button>
                <div className="h-8 w-px bg-gray-200 mx-2"></div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <span className="block text-sm font-bold text-slate-800">Saulo Machado</span>
                        <span className="block text-xs text-brand-secondary font-medium">Karikal</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-gray-200">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
}

export default function PacienteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden">
            <SidebarPaciente />
            <div className="flex flex-col flex-1 overflow-hidden w-full bg-[#f8f9fa]">
                <HeaderPaciente />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
