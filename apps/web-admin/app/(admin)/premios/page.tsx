import { Gift, Plus, QrCode, Search, Award } from 'lucide-react';

export default function PremiosPage() {
    const brindes = [
        { id: 1, name: 'Squeeze Personalizado', provider: 'ACIAV Videira', points: 300, stock: 45, image: '🥤' },
        { id: 2, name: 'Limpeza de Pele', provider: 'Clínica Estética Bella', points: 1200, stock: 5, image: '💆‍♀️' },
        { id: 3, name: 'Desconto 20% em Suplementos', provider: 'Farmácia Preço Popular', points: 500, stock: 999, image: '💊' },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Gift className="text-primary" />
                        Central de Gamificação
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gerencie catálogo de brindes e valide os cupons de resgate dos usuários.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                        <Plus size={16} /> Novo Brinde
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Painel de Validação de Voucher (Destaque Principal) */}
                <div className="lg:col-span-1 bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 opacity-10">
                        <QrCode size={150} />
                    </div>
                    <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                        <Award />
                        Validar Voucher
                    </h3>
                    <p className="text-primary-100 text-sm mb-6">Digite o código de 6 dígitos gerado pelo aplicativo do paciente para debitar os pontos do resgate.</p>

                    <div className="space-y-4 relative z-10">
                        <div>
                            <label className="text-xs font-bold text-primary-200 uppercase tracking-wider mb-1 block">Código do Cupom</label>
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="Ex: A7X9P2"
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-2xl tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-white/50"
                            />
                        </div>
                        <button className="w-full bg-secondary hover:bg-secondary-dark text-white font-bold py-3 rounded-xl transition-colors shadow-md">
                            Processar Resgate
                        </button>
                    </div>
                </div>

                {/* Catálogo de Prêmios */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 text-lg">Catálogo Ativo</h3>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar brinde..."
                                className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {brindes.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                        {item.image}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{item.name}</h4>
                                        <p className="text-xs text-slate-500">Oferecido por: {item.provider}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-slate-500 mb-0.5">Custo</p>
                                        <div className="flex items-center gap-1 text-primary font-bold">
                                            {item.points} pts
                                        </div>
                                    </div>
                                    <div className="text-right w-20">
                                        <p className="text-xs font-medium text-slate-500 mb-0.5">Estoque</p>
                                        <p className="font-bold text-slate-800">
                                            {item.stock}
                                        </p>
                                    </div>
                                    <button className="text-slate-400 hover:text-primary font-medium text-sm transition-colors">
                                        Editar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
