import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(unitId: string) {
    const [totalUsers, totalCompanies, totalProviders, totalTransactions, totalSaved] =
      await Promise.all([
        this.prisma.user.count({ where: { unitId, status: true } }),
        this.prisma.company.count({ where: { unitId, status: true } }),
        this.prisma.provider.count({ where: { unitId } }),
        this.prisma.transaction.count({
          where: { user: { unitId } },
        }),
        this.prisma.transaction.aggregate({
          where: { user: { unitId } },
          _sum: { amountSaved: true },
        }),
      ]);

    const economiaTotal = Number(totalSaved._sum.amountSaved || 0);

    // Gráfico: últimos 6 meses de transações
    const chart = await this.getChartData(unitId);

    return {
      totalUsers,
      totalCompanies,
      totalProviders,
      totalTransactions,
      economiaTotal,
      chart,
    };
  }

  private async getChartData(unitId: string) {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const [atendimentos, economiaAgg] = await Promise.all([
        this.prisma.transaction.count({
          where: {
            user: { unitId },
            createdAt: { gte: date, lt: nextDate },
          },
        }),
        this.prisma.transaction.aggregate({
          where: {
            user: { unitId },
            createdAt: { gte: date, lt: nextDate },
          },
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
