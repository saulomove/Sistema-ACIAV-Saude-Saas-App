import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async createWithUnitValidation(data: {
    userId: string;
    providerId: string;
    serviceId: string;
    amountSaved: number;
    providerUnitId?: string;
  }) {
    // Valida que o beneficiário pertence à mesma unidade do credenciado
    if (data.providerUnitId) {
      const user = await this.prisma.user.findFirst({
        where: { id: data.userId, unitId: data.providerUnitId },
      });
      if (!user) {
        throw new ForbiddenException('Beneficiário não pertence à unidade deste credenciado.');
      }
    }
    return this.create(data);
  }

  async create(data: {
    userId: string;
    providerId: string;
    serviceId: string;
    amountSaved: number;
  }) {
    const service = await this.prisma.service.findUnique({ where: { id: data.serviceId } });
    const saved = data.amountSaved || Number(service?.originalPrice || 0) - Number(service?.discountedPrice || 0);

    const tx = await this.prisma.transaction.create({
      data: {
        userId: data.userId,
        providerId: data.providerId,
        serviceId: data.serviceId,
        amountSaved: saved > 0 ? saved : 0,
      },
      include: {
        user: { select: { fullName: true, cpf: true } },
        provider: { select: { name: true, category: true } },
        service: { select: { description: true, discountedPrice: true } },
      },
    });

    // 1 ponto por R$1 economizado
    const points = Math.floor(saved);
    if (points > 0) {
      await this.prisma.user.update({
        where: { id: data.userId },
        data: { pointsBalance: { increment: points } },
      });
    }

    return tx;
  }

  async findByProvider(providerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { providerId },
        include: {
          user: { select: { fullName: true, cpf: true } },
          service: { select: { description: true, discountedPrice: true, originalPrice: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: { providerId } }),
    ]);
    return { items, total, page, limit };
  }

  async findByUser(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: {
        provider: { select: { name: true, category: true } },
        service: { select: { description: true, discountedPrice: true, originalPrice: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUnit(unitId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { user: { unitId } },
        include: {
          user: { select: { fullName: true, cpf: true } },
          provider: { select: { name: true, category: true } },
          service: { select: { description: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: { user: { unitId } } }),
    ]);
    return { items, total, page, limit };
  }
}
