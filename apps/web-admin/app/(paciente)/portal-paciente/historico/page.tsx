'use client';

import { motion } from 'framer-motion';
import { Activity, Stethoscope, Store, AlertCircle, Search, Filter } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HistoricoUsoPage() {
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
    };

    const dataChart = [
        { name: 'Set', economia: 150 },
        { name: 'Out', economia: 300 },
        { name: 'Nov', economia: 200 },
        { name: 'Dez', economia: 450 },
        { name: 'Jan', economia: 250 },
        { name: 'Fev', economia: 500 },
    ];

    const historico = [
        { id: 1, data: "24 Fev 2026", credenciado: "Clínica Sorriso Saudável", especialidade: "Odontologia", beneficiario: "Saulo Machado (Titular)", valorBalcao: 250.00, valorPago: 180.00, economia: 70.00, icon: Stethoscope, color: "text-emerald-500", bg: "bg-emerald-50" },
        { id: 2, data: "10 Fev 2026", credenciado: "Farmácia Preço Baixo", especialidade: "Medicamentos", beneficiario: "Maria Joaquina (Dependente)", valorBalcao: 120.00, valorPago: 95.00, economia: 25.00, icon: Store, color: "text-secondary", bg: "bg-orange-50" },
    ];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto space-y-8"
        >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Histórico de Uso</h1>
                    <p className="text-slate-500 mt-2 font-medium">Extrato de utilizações e economia gerada na rede credenciada.</p>
                </div>
            </motion.div>

            {/* Gráfico de Economia */}
            <motion.div variants={itemVariants} className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Evolução da Economia</h3>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Quanto você economizou nos últimos 6 meses usando o ACIAV Saúde.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">Total Salvo</p>
                        <p className="text-3xl font-black text-primary">R$ 1.920,00</p>
                    </div>
                </div>

                <div className="flex-1 w-full h-[250px] relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dataChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorEconomia" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#007178" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#007178" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                itemStyle={{ color: '#007178' }}
                                formatter={(value: any) => [`R$ ${value},00`, 'Economia']}
                            />
                            <Area
                                type="monotone"
                                dataKey="economia"
                                stroke="#007178"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorEconomia)"
                                activeDot={{ r: 8, strokeWidth: 0, fill: '#ea5f09' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Filtros e Busca */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Buscar por credenciado, especialidade..." className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 shadow-sm" />
                </div>
                <button className="bg-white border border-gray-200 text-slate-700 px-6 py-3 rounded-xl font-bold transition-all shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2">
                    <Filter size={18} /> Filtrar
                </button>
            </motion.div>

            {/* Timeline do Extrato */}
            <motion.div variants={itemVariants} className="space-y-4">
                {historico.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-800">Nenhum uso registrado</h3>
                        <p className="text-slate-500 mt-2">Você ainda não utilizou a rede credenciada neste período.</p>
                    </div>
                ) : (
                    historico.map((item) => (
                        <motion.div
                            key={item.id}
                            whileHover={{ y: -2, scale: 1.005 }}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                                    <item.icon size={26} strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.data} • {item.especialidade}</p>
                                    <h3 className="text-lg font-bold text-slate-800 mt-1">{item.credenciado}</h3>
                                    <p className="text-sm text-slate-500 font-medium">Paciente: {item.beneficiario}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 text-right min-w-[200px]">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-slate-500 font-medium">Valor Balcão:</span>
                                    <span className="text-xs text-slate-400 line-through">R$ {item.valorBalcao.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-700">Você Pagou:</span>
                                    <span className="text-sm font-black text-slate-800">R$ {item.valorPago.toFixed(2)}</span>
                                </div>
                                <div className="pt-2 border-t border-primary/10 flex justify-between items-center">
                                    <span className="text-xs font-bold text-primary">ECONOMIA:</span>
                                    <span className="text-base font-black text-primary">+ R$ {item.economia.toFixed(2)}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </motion.div>

        </motion.div>
    );
}
