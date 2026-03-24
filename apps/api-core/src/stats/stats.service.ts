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

  async getBillingStats() {
    const units = await this.prisma.unit.findMany({
      where: { status: true },
      include: {
        _count: { select: { users: true, companies: true, providers: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const result = await Promise.all(
      units.map(async (unit) => {
        const [totalTransactions, economiaAgg] = await Promise.all([
          this.prisma.transaction.count({ where: { user: { unitId: unit.id } } }),
          this.prisma.transaction.aggregate({
            where: { user: { unitId: unit.id } },
            _sum: { amountSaved: true },
          }),
        ]);

        const last30 = await this.prisma.transaction.count({
          where: {
            user: { unitId: unit.id },
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        });

        return {
          id: unit.id,
          name: unit.name,
          subdomain: unit.subdomain,
          vidas: unit._count.users,
          empresas: unit._count.companies,
          credenciados: unit._count.providers,
          totalTransactions,
          economiaTotal: Number(economiaAgg._sum.amountSaved || 0),
          atendimentosUltimos30Dias: last30,
        };
      }),
    );

    const totalEconomia = result.reduce((s, u) => s + u.economiaTotal, 0);
    const totalVidas = result.reduce((s, u) => s + u.vidas, 0);
    const totalAtendimentos = result.reduce((s, u) => s + u.totalTransactions, 0);

    return { units: result, totalEconomia, totalVidas, totalAtendimentos };
  }

  private async getChartData(unitId?: string) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const unitFilter = unitId ? { user: { unitId } } : {};

    const rows = await this.prisma.transaction.findMany({
      where: { ...unitFilter, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, amountSaved: true },
    });

    // Build month buckets in memory (1 query instead of 12)
    const buckets: Record<string, { atendimentos: number; economia: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets[key] = { atendimentos: 0, economia: 0 };
    }

    for (const row of rows) {
      const d = new Date(row.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (buckets[key]) {
        buckets[key].atendimentos++;
        buckets[key].economia += Number(row.amountSaved || 0);
      }
    }

    return Object.entries(buckets).map(([key, val]) => {
      const [year, month] = key.split('-').map(Number);
      const label = new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'short' });
      return { name: label, ...val };
    });
  }
}
