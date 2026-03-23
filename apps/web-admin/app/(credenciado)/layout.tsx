import SidebarCred from '../../components/SidebarCred';
import { Bell } from 'lucide-react';

// Custom Header Credenciado
function HeaderCred() {
    return (
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-end px-8 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-4">
                <button className="relative p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="h-8 w-px bg-gray-200 mx-2"></div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Recepção Clínica Saúde Total</span>
                    <div className="w-8 h-8 rounded-full bg-primary-900 text-white flex items-center justify-center font-bold text-sm">
                        CS
                    </div>
                </div>
            </div>
        </header>
    );
}

export default function CredenciadoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden">
            <SidebarCred />
            <div className="flex flex-col flex-1 overflow-hidden w-full bg-slate-50">
                <HeaderCred />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
