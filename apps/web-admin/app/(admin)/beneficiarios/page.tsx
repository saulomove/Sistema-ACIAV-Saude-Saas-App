import { Users, Plus, Search, MoreVertical, CreditCard, ActivitySquare } from 'lucide-react';

export default function BeneficiariosPage() {
    const beneficiarios = [
        { id: 1, name: 'Saulo Machado', cpf: '123.456.789-00', type: 'Titular', company: 'Karikal Comercio e Indústria', points: 150, status: 'Ativo' },
        { id: 2, name: 'Maria Silva Machado', cpf: '098.765.432-11', type: 'Dependente', company: 'Karikal Comercio e Indústria', points: 0, status: 'Ativo' },
        { id: 3, name: 'Carlos Ferreira', cpf: '333.444.555-66', type: 'Titular', company: 'Videira Implementos', points: 30, status: 'Inativo' },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="text-primary" />
                        Gestão de Beneficiários
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Consulte titulares, dependentes e emita carteirinhas.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                        <Plus size={16} /> Novo Beneficiário
                    </button>
                </div>
            </div>

            {/* Busca e Filtros Avançados */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por Nome, CPF ou Empresa..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <select className="bg-white border border-gray-200 text-sm rounded-lg px-4 py-2 text-slate-700 outline-none">
                    <option>Todos os Vínculos</option>
                    <option>Apenas Titulares</option>
                    <option>Apenas Dependentes</option>
                </select>
                <select className="bg-white border border-gray-200 text-sm rounded-lg px-4 py-2 text-slate-700 outline-none">
                    <option>Status: Ativo</option>
                    <option>Status: Inativo</option>
                    <option>Todos</option>
                </select>
            </div>

            {/* Tabela de Resultados */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Nome Completo</th>
                                <th className="px-6 py-4">CPF</th>
                                <th className="px-6 py-4">Vínculo</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Extrato / Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {beneficiarios.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-800">{user.name}</span>
                                            <span className="text-xs text-slate-500 mt-0.5">{user.company}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{user.cpf}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md border ${user.type === 'Titular' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                            {user.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${user.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                                        <button title="Ver Histórico de Uso" className="text-slate-400 hover:text-secondary transition-colors p-1">
                                            <ActivitySquare size={18} />
                                        </button>
                                        <button title="Emitir 2ª Via da Carteirinha" className="text-slate-400 hover:text-primary transition-colors p-1">
                                            <CreditCard size={18} />
                                        </button>
                                        <button className="text-slate-400 hover:text-slate-800 p-1">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
