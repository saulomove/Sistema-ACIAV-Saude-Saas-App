'use client';

import { Activity, Users, Building, TrendingUp, ChevronRight, Calendar, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const dataChart = [
    { name: 'Jan', atendimentos: 1200, economia: 4000 },
    { name: 'Fev', atendimentos: 1900, economia: 6000 },
    { name: 'Mar', atendimentos: 1500, economia: 5000 },
    { name: 'Abr', atendimentos: 2400, economia: 7500 },
    { name: 'Mai', atendimentos: 2100, economia: 6800 },
    { name: 'Jun', atendimentos: 3000, economia: 9000 },
    { name: 'Jul', atendimentos: 3400, economia: 10500 },
];

export default function Dashboard() {
    const stats = [
        { title: 'Total Vidas', value: '14.205', trend: '+12%', icon: Users, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
        { title: 'Empresas Ativas', value: '384', trend: '+5%', icon: Building, color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
        { title: 'Credenciados', value: '1.432', trend: '+2%', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
        { title: 'Economia Gerada', value: 'R$ 2.4M', trend: '+18%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8 max-w-7xl mx-auto"
        >
            {/* Header Section */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard ACIAV</h1>
                    <p className="text-slate-500 mt-2 font-medium">Visão estratégica e analítica do seu ecossistema de saúde.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select className="pl-10 pr-10 py-2.5 bg-white border border-gray-200 text-sm font-semibold rounded-xl text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 shadow-sm appearance-none cursor-pointer transition-all hover:border-primary/50">
                            <option>Últimos 6 Meses</option>
                            <option>Este Ano</option>
                            <option>Todo Período</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={i}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            className={`bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border ${stat.border} flex flex-col justify-between relative overflow-hidden group`}
                        >
                            {/* Abstract glow */}
                            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.bg} blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />

                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-bold tracking-wider uppercase text-slate-400 mb-2">{stat.title}</p>
                                    <h3 className="text-4xl font-black text-slate-800 tracking-tight">{stat.value}</h3>
                                </div>
                                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon size={24} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="relative z-10 mt-6 flex items-center text-sm bg-slate-50 w-fit px-3 py-1.5 rounded-full border border-gray-100">
                                <span className={`font-bold flex items-center gap-1 ${stat.color}`}>
                                    <ArrowUpRight size={16} /> {stat.trend}
                                </span>
                                <span className="text-slate-500 ml-2 font-medium">vs último mês</span>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Charts & Lists Area */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Area Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Crescimento de Atendimentos</h3>
                            <p className="text-sm text-slate-500 mt-1 font-medium">Uso total da rede ACIAV nos últimos semestres.</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dataChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAtendimentos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#007178" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#007178" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 14, fontWeight: 500 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 14, fontWeight: 500 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                    itemStyle={{ color: '#007178' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="atendimentos"
                                    stroke="#007178"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorAtendimentos)"
                                    activeDot={{ r: 8, strokeWidth: 0, fill: '#ea5f09' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Providers List */}
                <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-800">Top Credenciados</h3>
                    </div>
                    <div className="flex-1 space-y-5">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-primary/5 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-primary/20">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 font-bold border border-gray-100 group-hover:text-primary group-hover:border-primary/30 transition-colors">
                                        C{i + 1}
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-slate-800 group-hover:text-primary transition-colors">Clínica Saúde {i + 1}</p>
                                        <p className="text-sm text-slate-500 font-medium">{320 - (i * 45)} atendimentos</p>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-300 group-hover:text-primary transition-colors translate-x-0 group-hover:translate-x-1" />
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-4 text-sm font-bold text-secondary hover:text-white hover:bg-secondary border-2 border-secondary rounded-xl transition-all shadow-sm hover:shadow-lg">
                        Ver Ranking Completo
                    </button>
                </div>

            </motion.div>
        </motion.div>
    );
}
