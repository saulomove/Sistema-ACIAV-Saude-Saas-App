import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaService) {}

  async findAll(unitId?: string, category?: string, search?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where = {
      ...(unitId && { unitId, status: true }),
      ...(category && { category }),
      ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
    };
    const [data, total] = await Promise.all([
      this.prisma.provider.findMany({
        where,
        include: { _count: { select: { transactions: true, services: true } } },
        orderBy: { rankingScore: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.provider.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    return this.prisma.provider.findUnique({
      where: { id },
      include: { services: true, _count: { select: { transactions: true } } },
    });
  }

  async create(data: { unitId: string; name: string; category: string; address?: string; bio?: string }) {
    return this.prisma.provider.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.provider.update({ where: { id }, data });
  }

  async ranking(unitId: string, limit = 5) {
    const providers = await this.prisma.provider.findMany({
      where: { unitId },
      include: { _count: { select: { transactions: true } } },
      orderBy: { rankingScore: 'desc' },
      take: limit,
    });

    return providers.map((p, i) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      rankingScore: p.rankingScore,
      totalTransactions: p._count.transactions,
      position: i + 1,
    }));
  }

  async remove(id: string) {
    return this.prisma.provider.update({ where: { id }, data: { status: false } });
  }

  // ─── Services ───────────────────────────────────────────────────────────────

  async getServices(providerId: string) {
    return this.prisma.service.findMany({ where: { providerId } });
  }

  async createService(providerId: string, data: { description: string; originalPrice: number; discountedPrice: number }) {
    return this.prisma.service.create({ data: { providerId, ...data } });
  }

  async updateService(serviceId: string, data: { description?: string; originalPrice?: number; discountedPrice?: number }) {
    return this.prisma.service.update({ where: { id: serviceId }, data });
  }

  async deleteService(serviceId: string) {
    return this.prisma.service.delete({ where: { id: serviceId } });
  }

  // ─── Rewards ────────────────────────────────────────────────────────────────

  async getRewardsByUnit(unitId: string) {
    return this.prisma.reward.findMany({
      where: { provider: { unitId } },
      include: { provider: { select: { id: true, name: true, category: true } } },
      orderBy: { pointsRequired: 'asc' },
    });
  }

  async getRewardsByProvider(providerId: string) {
    return this.prisma.reward.findMany({
      where: { providerId },
      orderBy: { pointsRequired: 'asc' },
    });
  }

  async createReward(providerId: string, data: { name: string; pointsRequired: number; stock: number }) {
    return this.prisma.reward.create({ data: { providerId, ...data } });
  }

  async updateReward(rewardId: string, data: { name?: string; pointsRequired?: number; stock?: number }) {
    return this.prisma.reward.update({ where: { id: rewardId }, data });
  }

  async deleteReward(rewardId: string) {
    return this.prisma.reward.delete({ where: { id: rewardId } });
  }
}
