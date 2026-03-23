import { Stethoscope, Plus, Search, MoreVertical, ShieldCheck, HeartPulse, Store, Star } from 'lucide-react';

export default function CredenciadosPage() {
    const credenciados = [
        { id: 1, name: 'Clínica Saúde Total', category: 'Odontologia', rating: 4.8, atendimentos: 1450, status: 'Ativo', catIcon: ShieldCheck, catColor: 'text-emerald-500', bg: 'bg-emerald-50' },
        { id: 2, name: 'Farmácia Preço Popular', category: 'Farmácia', rating: 4.5, atendimentos: 3200, status: 'Ativo', catIcon: Store, catColor: 'text-orange-500', bg: 'bg-orange-50' },
        { id: 3, name: 'Dr. João Silva - Pediatra', category: 'Médico', rating: 4.9, atendimentos: 850, status: 'Ativo', catIcon: Stethoscope, catColor: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 4, name: 'Centro de Terapia Bem Viver', category: 'Terapias', rating: 4.2, atendimentos: 120, status: 'Inativo', catIcon: HeartPulse, catColor: 'text-purple-500', bg: 'bg-purple-50' },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Stethoscope className="text-primary" />
                        Gestão de Credenciados
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gerencie Clínicas, Médicos e Farmácias credenciadas na sua unidade.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                        Tabela de Preços Global
                    </button>
                    <button className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                        <Plus size={16} /> Novo Credenciado
                    </button>
                </div>
            </div>

            {/* Navegação Interna / Filtros (Simulada) */}
            <div className="flex gap-4 border-b border-gray-200">
                <button className="px-4 py-3 border-b-2 border-primary text-primary font-medium text-sm">Todos os Parceiros</button>
                <button className="px-4 py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm">Aguardando Aprovação (2)</button>
                <button className="px-4 py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm">Ranking Top 10</button>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar clínica ou médico..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <select className="bg-white border border-gray-200 text-sm rounded-lg px-4 py-2 text-slate-700 outline-none">
                        <option>Todas as Categorias</option>
                        <option>Odontologia</option>
                        <option>Médicos</option>
                        <option>Farmácias</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Credenciado</th>
                                <th className="px-6 py-4">Categoria</th>
                                <th className="px-6 py-4">Ranking (IA)</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {credenciados.map((cred) => {
                                const CatIcon = cred.catIcon;
                                return (
                                    <tr key={cred.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-800">{cred.name}</span>
                                                <span className="text-xs text-slate-500 mt-0.5">{cred.atendimentos} atendimentos via portal</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${cred.bg} ${cred.catColor} rounded-md text-xs font-semibold`}>
                                                <CatIcon size={14} /> {cred.category}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-amber-500 font-medium">
                                                <Star size={16} fill="currentColor" strokeWidth={0} /> {cred.rating}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" defaultChecked={cred.status === 'Ativo'} />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-primary hover:text-primary-dark font-medium mr-4">Catálogo</button>
                                            <button className="text-slate-400 hover:text-primary p-1">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
