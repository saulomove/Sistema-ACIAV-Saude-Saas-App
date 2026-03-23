import { Users, TrendingUp, Activity, FileSpreadsheet, Plus } from 'lucide-react';

export default function PortalRHPage() {
    const stats = [
        { title: 'Vidas Ativas', value: '450', info: '70% da capacidade plano', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
        { title: 'Consultas Realizadas', value: '1.240', info: 'Nos últimos 30 dias', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Economia Gerada', value: 'R$ 42.500', info: 'Valor salvo pelo time', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard de Benefícios</h1>
                    <p className="text-slate-500 text-sm mt-1">Acompanhe o impacto da saúde corporativa na sua equipe.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
                        <FileSpreadsheet size={16} /> Importar Colaboradores
                    </button>
                    <button className="bg-brand-secondary hover:bg-[#c44400] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                        <Plus size={16} /> Novo Cadastro
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                                    <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <Icon size={24} />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-slate-400">
                                {stat.info}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-slate-800 mb-6">Utilização por Categoria</h3>
                    <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center min-h-[250px]">
                        <p className="text-slate-400 text-sm italic">Gráfico de Pizza (Médicos, Dentistas, Exames)</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800">Últimas Integrações</h3>
                        <button className="text-sm text-primary font-medium hover:underline">Ver todos</button>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                        {['SM', 'JF', 'AL', 'MR'][i]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{['Saulo Machado', 'João Ferreira', 'Ana Lima', 'Marcos Roque'][i]}</p>
                                        <p className="text-xs text-emerald-600 font-medium">Ativo</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">Dependetes</p>
                                    <p className="font-bold text-slate-700">{Math.floor(Math.random() * 3)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
