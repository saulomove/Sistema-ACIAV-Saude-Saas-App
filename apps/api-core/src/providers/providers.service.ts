import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaService) {}

  async findAll(unitId?: string, category?: string, search?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where = {
      ...(unitId && { unitId, status: true }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { professionalName: { contains: search, mode: 'insensitive' as const } },
          { clinicName: { contains: search, mode: 'insensitive' as const } },
          { specialty: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
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

  async create(data: {
    unitId: string;
    name: string;
    professionalName?: string;
    clinicName?: string;
    registration?: string;
    cpfCnpj?: string;
    category: string;
    specialty?: string;
    address?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    discountType?: string;
    discountValue?: number;
    bio?: string;
  }) {
    // name = clinicName se existir, senão professionalName
    const displayName = data.clinicName?.trim() || data.professionalName?.trim() || data.name;

    const provider = await this.prisma.provider.create({
      data: {
        unitId: data.unitId,
        name: displayName,
        professionalName: data.professionalName,
        clinicName: data.clinicName,
        registration: data.registration,
        cpfCnpj: data.cpfCnpj,
        category: data.category,
        specialty: data.specialty,
        address: data.address,
        phone: data.phone,
        whatsapp: data.whatsapp,
        email: data.email,
        discountType: data.discountType ?? 'fixed',
        discountValue: data.discountValue ?? 0,
        bio: data.bio,
      },
    });

    // Auto-cria AuthUser com role=provider se email fornecido
    let tempPassword: string | null = null;
    if (data.email) {
      const existing = await this.prisma.authUser.findUnique({ where: { email: data.email } });
      if (!existing) {
        tempPassword = Math.random().toString(36).slice(-8) + 'A1';
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        await this.prisma.authUser.create({
          data: {
            email: data.email,
            passwordHash,
            role: 'provider',
            unitId: data.unitId,
            providerId: provider.id,
          },
        });
      }
    }

    return { ...provider, tempPassword };
  }

  async update(id: string, data: any) {
    // Se mudar professionalName ou clinicName, atualiza name de exibição
    if (data.professionalName !== undefined || data.clinicName !== undefined) {
      const current = await this.prisma.provider.findUnique({ where: { id } });
      const clinicName = data.clinicName ?? current?.clinicName;
      const professionalName = data.professionalName ?? current?.professionalName;
      data.name = clinicName?.trim() || professionalName?.trim() || current?.name;
    }

    // Se email mudou, atualizar AuthUser
    if (data.email) {
      const provider = await this.prisma.provider.findUnique({ where: { id } });
      if (provider) {
        const authUser = await this.prisma.authUser.findFirst({ where: { providerId: id } });
        if (authUser && authUser.email !== data.email) {
          await this.prisma.authUser.update({
            where: { id: authUser.id },
            data: { email: data.email },
          });
        }
      }
    }

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

  async createService(providerId: string, data: { description: string; originalPrice: number; insurancePrice?: number; discountedPrice: number }) {
    return this.prisma.service.create({
      data: {
        providerId,
        description: data.description,
        originalPrice: data.originalPrice,
        insurancePrice: data.insurancePrice ?? 0,
        discountedPrice: data.discountedPrice,
      },
    });
  }

  async updateService(serviceId: string, data: { description?: string; originalPrice?: number; insurancePrice?: number; discountedPrice?: number }) {
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
