import { Bell, Search, Menu } from 'lucide-react';

export default function Header() {
    return (
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-4 w-1/2">
                <button className="lg:hidden text-gray-400 hover:text-primary transition-colors">
                    <Menu size={24} />
                </button>
                <div className="relative w-full max-w-md hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar clínicas, CPFs ou empresas..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative p-2 text-gray-400 hover:text-secondary hover:bg-orange-50 rounded-full transition-all">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full border-2 border-white"></span>
                </button>

                <div className="h-8 w-px bg-gray-200 mx-2"></div>

                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">ACIAV Videira</span>
                    <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                        UNIDADE ATIVA
                    </div>
                </div>
            </div>
        </header>
    );
}
