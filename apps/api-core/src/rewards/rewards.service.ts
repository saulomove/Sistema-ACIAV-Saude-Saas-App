import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RewardsService {
  constructor(private prisma: PrismaService) {}

  findAll(unitId?: string) {
    return this.prisma.reward.findMany({
      where: unitId ? { provider: { unitId } } : undefined,
      include: { provider: { select: { id: true, name: true, unitId: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const reward = await this.prisma.reward.findUnique({
      where: { id },
      include: { provider: { select: { id: true, name: true } } },
    });
    if (!reward) throw new NotFoundException('Prêmio não encontrado.');
    return reward;
  }

  create(data: { providerId: string; name: string; pointsRequired: number; stock?: number }) {
    return this.prisma.reward.create({ data });
  }

  async update(id: string, data: { name?: string; pointsRequired?: number; stock?: number }) {
    await this.findOne(id);
    return this.prisma.reward.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.reward.delete({ where: { id } });
  }
}
