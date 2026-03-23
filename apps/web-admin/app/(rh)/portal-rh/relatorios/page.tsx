import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import { ActivitySquare, TrendingUp, Users, UserPlus, ArrowUpRight } from 'lucide-react';

interface CompanyStats {
  totalColaboradores: number;
  totalDependentes: number;
  totalVidas: number;
  totalTransacoes: number;
  economiaTotal: number;
}

function fmtMoney(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`;
  return `R$ ${v.toFixed(2)}`;
}

function fmt(n: number) { return n.toLocaleString('pt-BR'); }

export default async function RelatoriosPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'rh') redirect('/login');

  const stats = user.companyId
    ? await serverFetch<CompanyStats>(`/stats/company?companyId=${user.companyId}`)
    : null;

  const metrics = [
    {
      label: 'Total de Colaboradores',
      value: fmt(stats?.totalColaboradores ?? 0),
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
      desc: 'Titulares ativos no plano',
    },
    {
      label: 'Dependentes',
      value: fmt(stats?.totalDependentes ?? 0),
      icon: UserPlus,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      desc: 'Vinculados aos titulares',
    },
    {
      label: 'Total de Vidas',
      value: fmt(stats?.totalVidas ?? 0),
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      desc: 'Titulares + dependentes',
    },
    {
      label: 'Atendimentos Realizados',
      value: fmt(stats?.totalTransacoes ?? 0),
      icon: ActivitySquare,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      desc: 'Total histórico de utilizações',
    },
    {
      label: 'Economia Total Gerada',
      value: fmtMoney(stats?.economiaTotal ?? 0),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      desc: 'Valor salvo vs. plano convencional',
    },
    {
      label: 'Média por Colaborador',
      value: stats && stats.totalColaboradores > 0
        ? fmtMoney(stats.economiaTotal / stats.totalColaboradores)
        : 'R$ 0',
      icon: ArrowUpRight,
      color: 'text-teal-600',
      bg: 'bg-teal-100',
      desc: 'Economia média por titular',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ActivitySquare className="text-secondary" /> Relatórios de Impacto
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Indicadores consolidados do plano de saúde da sua empresa.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${m.bg} ${m.color}`}>
                  <Icon size={22} />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{m.label}</p>
              <p className="text-3xl font-black text-slate-800">{m.value}</p>
              <p className="text-xs text-slate-400 mt-2">{m.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-700">
        Relatórios mais detalhados com gráficos e histórico mensal serão disponibilizados em breve.
        Os dados são atualizados em tempo real.
      </div>
    </div>
  );
}
