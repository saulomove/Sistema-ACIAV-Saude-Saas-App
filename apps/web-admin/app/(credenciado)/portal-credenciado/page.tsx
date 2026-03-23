import { Search, ShieldCheck, CheckCircle2, User, Stethoscope } from 'lucide-react';

export default function PortalCredenciadoPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Balcão de Atendimento</h1>
                    <p className="text-slate-500 text-sm mt-1">Busque o paciente, valide os descontos e registre o serviço.</p>
                </div>
            </div>

            {/* Busca Principal (Big Search Bar) */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Search className="text-primary-600" /> Consultar Beneficiário (CPF)
                    </h2>
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            placeholder="Digite o CPF do Paciente..."
                            className="flex-1 bg-slate-50 border-2 border-gray-100 rounded-xl px-6 py-4 text-xl tracking-widest text-slate-700 focus:outline-none focus:border-primary-500 focus:bg-white transition-all font-mono"
                        />
                        <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-md text-lg">
                            Validar
                        </button>
                    </div>
                </div>
            </div>

            {/* Simulação de Resultado Positivo */}
            <div className="bg-primary-50/50 rounded-2xl p-6 border-2 border-primary-100 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-full border-4 border-primary-200 flex items-center justify-center text-primary-600">
                            <User size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-2xl font-bold text-slate-800">Saulo Machado</h3>
                                <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <CheckCircle2 size={14} /> ATIVO
                                </span>
                            </div>
                            <p className="text-slate-500 text-sm mt-1">Card: #ACIAV-4091-22 | Karikal Comércio e Indústria</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-primary-200/50">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Stethoscope size={20} className="text-primary-600" />
                        Lançar Procedimento
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Quem será atendido?</label>
                            <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                                <option>Saulo Machado (Titular)</option>
                                <option>Maria Silva (Dependente)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Selecione o Serviço</label>
                            <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                                <option>Consulta Cíinico Geral (Desconto ACIAV: 30%)</option>
                                <option>Raio-X (Desconto ACIAV: 15%)</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 bg-white rounded-xl p-4 border border-primary-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Valor Particular: <span className="line-through">R$ 200,00</span></p>
                            <p className="text-xs text-primary-600 font-bold mt-1">Economia gerada pro cliente: R$ 60,00</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-700">O paciente deve pagar:</p>
                            <p className="text-3xl font-black text-primary-600">R$ 140,00</p>
                        </div>
                    </div>

                    <button className="w-full mt-6 bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-xl font-bold transition-colors shadow-lg text-lg flex items-center justify-center gap-2">
                        <ShieldCheck size={24} /> Registrar Uso do Benefício
                    </button>
                </div>
            </div>
        </div>
    );
}
