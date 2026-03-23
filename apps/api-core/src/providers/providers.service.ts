import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaService) {}

  async findAll(unitId?: string, category?: string, search?: string) {
    return this.prisma.provider.findMany({
      where: {
        ...(unitId && { unitId, status: true }),
        ...(category && { category }),
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
      },
      include: {
        _count: { select: { transactions: true, services: true } },
      },
      orderBy: { rankingScore: 'desc' },
    });
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

  async remove(id: string) {
    return this.prisma.provider.update({ where: { id }, data: { status: false } });
  }
}
