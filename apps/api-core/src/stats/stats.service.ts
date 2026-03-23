import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(unitId?: string) {
    const unitFilter = unitId ? { unitId } : {};
    const unitUserFilter = unitId ? { user: { unitId } } : {};

    const [totalUsers, totalCompanies, totalProviders, totalTransactions, totalSaved] =
      await Promise.all([
        this.prisma.user.count({ where: { ...unitFilter, status: true } }),
        this.prisma.company.count({ where: { ...unitFilter, status: true } }),
        this.prisma.provider.count({ where: unitFilter }),
        this.prisma.transaction.count({ where: unitUserFilter }),
        this.prisma.transaction.aggregate({
          where: unitUserFilter,
          _sum: { amountSaved: true },
        }),
      ]);

    const economiaTotal = Number(totalSaved._sum.amountSaved || 0);
    const chart = await this.getChartData(unitId);

    return { totalUsers, totalCompanies, totalProviders, totalTransactions, economiaTotal, chart };
  }

  async getGlobalStats() {
    const [totalUnits, totalUsers, totalCompanies, totalProviders, totalTransactions, totalSaved] =
      await Promise.all([
        this.prisma.unit.count({ where: { status: true } }),
        this.prisma.user.count({ where: { status: true } }),
        this.prisma.company.count({ where: { status: true } }),
        this.prisma.provider.count(),
        this.prisma.transaction.count(),
        this.prisma.transaction.aggregate({ _sum: { amountSaved: true } }),
      ]);

    const economiaTotal = Number(totalSaved._sum.amountSaved || 0);
    const unitStats = await this.prisma.unit.findMany({
      where: { status: true },
      include: { _count: { select: { users: true, companies: true, providers: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const chart = await this.getChartData();

    return {
      totalUnits,
      totalUsers,
      totalCompanies,
      totalProviders,
      totalTransactions,
      economiaTotal,
      chart,
      units: unitStats.map((u) => ({
        id: u.id,
        name: u.name,
        subdomain: u.subdomain,
        vidas: u._count.users,
        empresas: u._count.companies,
        credenciados: u._count.providers,
      })),
    };
  }

  async getCompanyStats(companyId: string) {
    const [totalColaboradores, totalDependentes, totalTransacoes, totalSaved] = await Promise.all([
      this.prisma.user.count({ where: { companyId, type: 'titular', status: true } }),
      this.prisma.user.count({ where: { companyId, type: 'dependente', status: true } }),
      this.prisma.transaction.count({ where: { user: { companyId } } }),
      this.prisma.transaction.aggregate({
        where: { user: { companyId } },
        _sum: { amountSaved: true },
      }),
    ]);

    const economiaTotal = Number(totalSaved._sum.amountSaved || 0);
    const ultimosColaboradores = await this.prisma.user.findMany({
      where: { companyId, type: 'titular' },
      include: { _count: { select: { dependents: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      totalColaboradores,
      totalDependentes,
      totalVidas: totalColaboradores + totalDependentes,
      totalTransacoes,
      economiaTotal,
      ultimosColaboradores: ultimosColaboradores.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        cpf: u.cpf,
        status: u.status,
        dependentes: u._count.dependents,
        createdAt: u.createdAt,
      })),
    };
  }

  private async getChartData(unitId?: string) {
    const months = [];
    const now = new Date();
    const unitFilter = unitId ? { user: { unitId } } : {};

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const [atendimentos, economiaAgg] = await Promise.all([
        this.prisma.transaction.count({
          where: { ...unitFilter, createdAt: { gte: date, lt: nextDate } },
        }),
        this.prisma.transaction.aggregate({
          where: { ...unitFilter, createdAt: { gte: date, lt: nextDate } },
          _sum: { amountSaved: true },
        }),
      ]);

      months.push({
        name: date.toLocaleDateString('pt-BR', { month: 'short' }),
        atendimentos,
        economia: Number(economiaAgg._sum.amountSaved || 0),
      });
    }

    return months;
  }
}
