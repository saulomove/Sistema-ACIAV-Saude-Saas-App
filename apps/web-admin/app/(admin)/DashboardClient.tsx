'use client';

import Link from 'next/link';
import { Activity, Users, Building, TrendingUp, ChevronRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartPoint {
  name: string;
  atendimentos: number;
  economia: number;
}

interface Provider {
  id: string;
  name: string;
  rankingScore: number;
  _count?: { transactions: number };
}

interface DashboardData {
  totalUsers: number;
  totalCompanies: number;
  totalProviders: number;
  totalTransactions: number;
  economiaTotal: number;
  chart: ChartPoint[];
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`;
  return `R$ ${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

export default function DashboardClient({
  stats,
  ranking,
}: {
  stats: DashboardData | null;
  ranking: Provider[] | null;
}) {
  const cards = [
    {
      title: 'Total Vidas',
      value: stats ? formatNumber(stats.totalUsers) : '—',
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20',
    },
    {
      title: 'Empresas Ativas',
      value: stats ? formatNumber(stats.totalCompanies) : '—',
      icon: Building,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      border: 'border-secondary/20',
    },
    {
      title: 'Credenciados',
      value: stats ? formatNumber(stats.totalProviders) : '—',
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      border: 'border-blue-200',
    },
    {
      title: 'Economia Gerada',
      value: stats ? formatCurrency(stats.economiaTotal) : '—',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      border: 'border-emerald-200',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard ACIAV</h1>
          <p className="text-slate-500 mt-2 font-medium">Visão estratégica e analítica do seu ecossistema de saúde.</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
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
                  <p className="text-sm font-bold tracking-wider uppercase text-slate-400 mb-2">{card.title}</p>
                  <h3 className="text-4xl font-black text-slate-800 tracking-tight">{card.value}</h3>
                </div>
                <div className={`p-4 rounded-2xl ${card.bg} ${card.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={24} strokeWidth={2.5} />
                </div>
              </div>
              <div className="relative z-10 mt-6 flex items-center text-sm bg-slate-50 w-fit px-3 py-1.5 rounded-full border border-gray-100">
                <span className={`font-bold flex items-center gap-1 ${card.color}`}>
                  <ArrowUpRight size={16} /> {stats ? `${stats.totalTransactions} usos` : '—'}
                </span>
                <span className="text-slate-500 ml-2 font-medium">no total</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts & Lists */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Crescimento de Atendimentos</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">Uso total da rede ACIAV nos últimos 6 meses.</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chart ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

        {/* Top Providers */}
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Top Credenciados</h3>
          </div>
          <div className="flex-1 space-y-5">
            {ranking && ranking.length > 0 ? (
              ranking.slice(0, 5).map((provider, i) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-4 bg-slate-50 hover:bg-primary/5 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-primary/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 font-bold border border-gray-100 group-hover:text-primary group-hover:border-primary/30 transition-colors">
                      C{i + 1}
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-800 group-hover:text-primary transition-colors">{provider.name}</p>
                      <p className="text-sm text-slate-500 font-medium">score {provider.rankingScore}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                </div>
              ))
            ) : (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              ))
            )}
          </div>
          <Link
            href="/credenciados"
            className="w-full mt-6 py-4 text-sm font-bold text-secondary hover:text-white hover:bg-secondary border-2 border-secondary rounded-xl transition-all shadow-sm hover:shadow-lg text-center"
          >
            Ver Ranking Completo
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
