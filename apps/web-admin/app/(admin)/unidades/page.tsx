import { Building, Plus, Search, MoreVertical, Globe, Settings2, ShieldCheck } from 'lucide-react';

export default function UnidadesPage() {
    const unidades = [
        { id: 1, name: 'ACIAV Videira', domain: 'videira.aciavsaude.com.br', users: 14205, status: 'Ativo' },
        { id: 2, name: 'ACIC Caçador', domain: 'cacador.convenios.com.br', users: 8400, status: 'Inativo' },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Building className="text-primary" />
                        Associações e Unidades
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gerencie os polos, subdomínios e identidades visuais White Label do sistema.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                        <Plus size={16} /> Nova Unidade
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {unidades.map((unit) => (
                    <div key={unit.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group hover:border-primary/20">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150`}></div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl font-bold text-slate-400">
                                    {unit.name.substring(0, 2)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 leading-tight">{unit.name}</h3>
                                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                        <Globe size={12} className="text-slate-400" />
                                        {unit.domain}
                                    </div>
                                </div>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${unit.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {unit.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                                <p className="text-xs font-medium text-slate-500 mb-1">Vidas</p>
                                <p className="font-bold text-slate-800">{unit.users.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                                <p className="text-xs font-medium text-slate-500 mb-1">Cores</p>
                                <div className="flex justify-center -space-x-2 mt-1">
                                    <div className="w-5 h-5 rounded-full bg-primary border-2 border-white shadow-sm"></div>
                                    <div className="w-5 h-5 rounded-full bg-secondary border-2 border-white shadow-sm"></div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-emerald-600 bg-emerald-50/50 border-emerald-100">
                                <ShieldCheck size={18} className="mb-1" />
                                <span className="text-[10px] font-bold">SSL Ativo</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 relative z-10 border-t border-gray-100 pt-4">
                            <button className="flex-1 bg-white border border-gray-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                <Settings2 size={16} /> White Label
                            </button>
                            <button className="w-auto text-slate-400 hover:text-slate-800 p-2">
                                <MoreVertical size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
