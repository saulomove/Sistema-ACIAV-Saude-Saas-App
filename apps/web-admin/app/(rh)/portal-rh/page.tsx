import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../lib/server-api';
import Link from 'next/link';
import { Users, UserPlus, TrendingUp, Activity, FileSpreadsheet, ArrowRight } from 'lucide-react';

interface CompanyStats {
  totalColaboradores: number;
  totalDependentes: number;
  totalVidas: number;
  totalTransacoes: number;
  economiaTotal: number;
  ultimosColaboradores: Array<{
    id: string;
    fullName: string;
    cpf: string;
    status: boolean;
    dependentes: number;
    createdAt: string;
  }>;
}

function fmtMoney(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`;
  return `R$ ${v.toFixed(0)}`;
}

function fmt(n: number) { return n.toLocaleString('pt-BR'); }

export default async function PortalRHPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'rh') redirect('/login');

  const stats = user.companyId
    ? await serverFetch<CompanyStats>(`/stats/company?companyId=${user.companyId}`)
    : null;

  const cards = [
    {
      title: 'Colaboradores Ativos',
      value: fmt(stats?.totalColaboradores ?? 0),
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
      info: `${fmt(stats?.totalVidas ?? 0)} vidas no total`,
    },
    {
      title: 'Dependentes',
      value: fmt(stats?.totalDependentes ?? 0),
      icon: UserPlus,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      info: 'Vinculados aos titulares',
    },
    {
      title: 'Atendimentos',
      value: fmt(stats?.totalTransacoes ?? 0),
      icon: Activity,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      info: 'Total de utilizações',
    },
    {
      title: 'Economia Gerada',
      value: fmtMoney(stats?.economiaTotal ?? 0),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      info: 'Valor salvo pela equipe',
    },
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
          <Link
            href="/portal-rh/importar"
            className="bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet size={16} /> Importar Planilha
          </Link>
          <Link
            href="/portal-rh/colaboradores"
            className="bg-secondary hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <Users size={16} /> Ver Colaboradores
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">{card.title}</p>
                  <h3 className="text-3xl font-bold text-slate-800">{card.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                  <Icon size={24} />
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-400">{card.info}</div>
            </div>
          );
        })}
      </div>

      {/* Últimos Colaboradores */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800">Últimos Cadastros</h3>
          <Link href="/portal-rh/colaboradores" className="text-sm text-secondary font-medium hover:underline flex items-center gap-1">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        {!stats || stats.ultimosColaboradores.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum colaborador cadastrado ainda.</p>
            <Link href="/portal-rh/importar" className="text-secondary text-sm font-medium mt-2 inline-block hover:underline">
              Importar planilha
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.ultimosColaboradores.map((u) => {
              const initials = u.fullName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
              return (
                <div key={u.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{u.fullName}</p>
                      <p className="text-xs text-slate-400">CPF: {u.cpf}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Dependentes</p>
                      <p className="font-bold text-slate-700">{u.dependentes}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${u.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {u.status ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
