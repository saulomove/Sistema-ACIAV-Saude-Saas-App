import { Building, Plus, Search, MoreVertical, FileSpreadsheet, Download } from 'lucide-react';

export default function EmpresasPage() {
    const empresas = [
        { id: 1, name: 'Karikal Comercio e Industria', cnpj: '00.123.456/0001-89', vidas: 450, status: 'Ativo' },
        { id: 2, name: 'Videira Implementos', cnpj: '11.888.777/0001-22', vidas: 120, status: 'Ativo' },
        { id: 3, name: 'Supermercados ABC', cnpj: '33.444.555/0002-10', vidas: 85, status: 'Inativo' },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Building className="text-secondary" />
                        Gestão de Empresas (RH)
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gerencie os polos, RHs conveniados e importe listas de vidas.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
                        <FileSpreadsheet size={16} /> Importar Planilha
                    </button>
                    <button className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                        <Plus size={16} /> Nova Empresa
                    </button>
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Empresas Cadastradas</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">384</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <Building size={24} />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Vidas Totais</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">14.205</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5V4H2v16h5m10 0v-5m-10 5v-5m10 0H7m10 0a3 3 0 100-6 3 3 0 000 6zm-10 0a3 3 0 100-6 3 3 0 000 6z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Tabela de Empresas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou CNPJ..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <button className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm font-medium">
                        <Download size={16} /> Exportar
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Nome da Empresa</th>
                                <th className="px-6 py-4">CNPJ</th>
                                <th className="px-6 py-4">Vidas Ativas</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {empresas.map((emp) => (
                                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">{emp.name}</td>
                                    <td className="px-6 py-4 font-mono text-xs">{emp.cnpj}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md text-slate-700 font-semibold text-xs border border-slate-200">
                                            {emp.vidas} dependentes
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${emp.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-primary p-1">
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
