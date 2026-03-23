'use client';

import { Globe, Users, Building, Stethoscope, TrendingUp, ArrowUpRight, Plus, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

interface UnitStat { id: string; name: string; subdomain: string; vidas: number; empresas: number; credenciados: number; }
interface ChartPoint { name: string; atendimentos: number; economia: number; }
interface GlobalStats {
  totalUnits: number;
  totalUsers: number;
  totalCompanies: number;
  totalProviders: number;
  totalTransactions: number;
  economiaTotal: number;
  chart: ChartPoint[];
  units: UnitStat[];
}

function fmt(n: number) { return n.toLocaleString('pt-BR'); }
function fmtMoney(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`;
  return `R$ ${v.toFixed(0)}`;
}

export default function SuperAdminDashboard({ stats }: { stats: GlobalStats | null }) {
  const cards = [
    { title: 'Unidades Ativas', value: fmt(stats?.totalUnits ?? 0), icon: Globe, color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
    { title: 'Total de Vidas', value: fmt(stats?.totalUsers ?? 0), icon: Users, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
    { title: 'Empresas', value: fmt(stats?.totalCompanies ?? 0), icon: Building, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
    { title: 'Economia Gerada', value: fmtMoney(stats?.economiaTotal ?? 0), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  ];

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-1 bg-secondary/10 text-secondary text-xs font-bold rounded-full">PAINEL GLOBAL</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard ACIAV Saúde</h1>
          <p className="text-slate-500 mt-1 font-medium">Visão consolidada de todas as unidades do SaaS.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/unidades" className="flex items-center gap-2 bg-white border border-gray-200 hover:border-primary/30 text-slate-700 hover:text-primary px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm">
            <Globe size={16} /> Gerenciar Unidades
          </Link>
          <Link href="/admin-users" className="flex items-center gap-2 bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm">
            <Plus size={16} /> Novo Admin
          </Link>
        </div>
      </motion.div>

      {/* Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border ${card.border} flex flex-col justify-between relative overflow-hidden group`}
            >
              <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${card.bg} blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-2">{card.title}</p>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">{card.value}</h3>
                </div>
                <div className={`p-3 rounded-2xl ${card.bg} ${card.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={22} strokeWidth={2.5} />
                </div>
              </div>
              <div className="relative z-10 mt-4 flex items-center text-xs bg-slate-50 w-fit px-3 py-1.5 rounded-full border border-gray-100">
                <span className={`font-bold flex items-center gap-1 ${card.color}`}>
                  <ArrowUpRight size={14} /> {fmt(stats?.totalTransactions ?? 0)} transações
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Gráfico + Lista Unidades */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Gráfico */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Atendimentos Globais</h3>
            <p className="text-sm text-slate-500 mt-1">Todas as unidades — últimos 6 meses.</p>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chart ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGlobal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea5f09" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ea5f09" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 13, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 13, fontWeight: 500 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', fontWeight: 'bold' }} itemStyle={{ color: '#ea5f09' }} />
                <Area type="monotone" dataKey="atendimentos" stroke="#ea5f09" strokeWidth={3} fillOpacity={1} fill="url(#colorGlobal)" activeDot={{ r: 7, strokeWidth: 0, fill: '#007178' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lista de Unidades */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">Unidades Ativas</h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{stats?.totalUnits ?? 0}</span>
          </div>
          <div className="flex-1 space-y-3">
            {(stats?.units ?? []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Nenhuma unidade cadastrada</p>
            ) : (
              (stats?.units ?? []).map((unit, i) => (
                <div key={unit.id} className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </div>
                      <span className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">{unit.name}</span>
                    </div>
                    <Link href={`/unidades`} className="text-slate-300 hover:text-primary transition-colors">
                      <Settings size={15} />
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-slate-400">Vidas</p>
                      <p className="text-sm font-bold text-slate-700">{fmt(unit.vidas)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Empresas</p>
                      <p className="text-sm font-bold text-slate-700">{unit.empresas}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Credenciados</p>
                      <p className="text-sm font-bold text-slate-700">{unit.credenciados}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link
            href="/unidades"
            className="w-full mt-4 py-3 text-sm font-bold text-secondary hover:text-white hover:bg-secondary border-2 border-secondary rounded-xl transition-all text-center block"
          >
            Gerenciar Unidades
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
