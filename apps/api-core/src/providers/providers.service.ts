import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const DISCOUNT_MIN = 5;
const DISCOUNT_MAX = 20;

function clampInt(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : null;
}

function normalizeDiscountRange(minRaw: unknown, maxRaw: unknown): { min: number | null; max: number | null } {
  const min = clampInt(minRaw);
  const max = clampInt(maxRaw);
  if (min === null && max === null) return { min: null, max: null };
  const effectiveMin = min ?? max ?? null;
  const effectiveMax = max ?? min ?? null;
  if (effectiveMin !== null && (effectiveMin < DISCOUNT_MIN || effectiveMin > DISCOUNT_MAX)) {
    throw new BadRequestException(`Desconto mínimo deve estar entre ${DISCOUNT_MIN}% e ${DISCOUNT_MAX}%.`);
  }
  if (effectiveMax !== null && (effectiveMax < DISCOUNT_MIN || effectiveMax > DISCOUNT_MAX)) {
    throw new BadRequestException(`Desconto máximo deve estar entre ${DISCOUNT_MIN}% e ${DISCOUNT_MAX}%.`);
  }
  if (effectiveMin !== null && effectiveMax !== null && effectiveMin > effectiveMax) {
    throw new BadRequestException('Desconto mínimo não pode ser maior que o máximo.');
  }
  return { min: effectiveMin, max: effectiveMax };
}

function calcDiscounted(original: number, maxPercent: number | null): number {
  if (!original || original <= 0 || maxPercent === null) return Number(original) || 0;
  const value = original * (1 - maxPercent / 100);
  return Math.round(value * 100) / 100;
}

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    unitId?: string,
    category?: string,
    search?: string,
    page = 1,
    limit = 50,
    opts: { city?: string; sortBy?: string } = {},
  ) {
    const skip = (page - 1) * limit;
    const where = {
      ...(unitId && { unitId, status: true }),
      ...(category && { category }),
      ...(opts.city && { city: { equals: opts.city, mode: 'insensitive' as const } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { professionalName: { contains: search, mode: 'insensitive' as const } },
          { clinicName: { contains: search, mode: 'insensitive' as const } },
          { specialty: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    if (opts.sortBy === 'discount') {
      const rawData = await this.prisma.provider.findMany({
        where,
        include: {
          _count: { select: { transactions: true, services: true } },
          services: { select: { id: true, description: true, discountMinPercent: true, discountMaxPercent: true, originalPrice: true, discountedPrice: true } },
        },
      });
      const scored = rawData.map((p) => {
        const best = p.services.reduce((acc, s) => {
          const pct = s.discountMaxPercent
            ?? (Number(s.originalPrice) > 0
              ? Math.round(((Number(s.originalPrice) - Number(s.discountedPrice)) / Number(s.originalPrice)) * 100)
              : 0);
          return Math.max(acc, pct);
        }, 0);
        return { ...p, bestDiscount: best };
      });
      scored.sort((a, b) => (b.bestDiscount || 0) - (a.bestDiscount || 0) || (b.rankingScore - a.rankingScore));
      const total = scored.length;
      const paged = scored.slice(skip, skip + limit);
      return { data: paged, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const [data, total] = await Promise.all([
      this.prisma.provider.findMany({
        where,
        include: {
          _count: { select: { transactions: true, services: true } },
          services: { select: { id: true, description: true, discountMinPercent: true, discountMaxPercent: true, originalPrice: true, discountedPrice: true } },
        },
        orderBy: { rankingScore: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.provider.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async listCities(unitId: string) {
    if (!unitId) return [];
    const rows = await this.prisma.provider.findMany({
      where: { unitId, status: true, city: { not: null } },
      distinct: ['city'],
      select: { city: true },
      orderBy: { city: 'asc' },
    });
    return rows.map((r) => r.city).filter((c): c is string => !!c);
  }

  async listCategories(unitId: string) {
    if (!unitId) return [];
    const rows = await this.prisma.provider.findMany({
      where: { unitId, status: true },
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' },
    });
    return rows.map((r) => r.category).filter(Boolean);
  }

  async trackClick(providerId: string, data: { userId: string | null; channel: string; ip: string | null; userAgent: string | null }) {
    return this.prisma.providerContactClick.create({
      data: {
        providerId,
        userId: data.userId,
        channel: data.channel,
        ip: data.ip,
        userAgent: data.userAgent?.slice(0, 500),
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.provider.findUnique({
      where: { id },
      include: { services: true, _count: { select: { transactions: true } } },
    });
  }

  async getServiceUnit(serviceId: string): Promise<string | null> {
    const s = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { provider: { select: { unitId: true } } },
    });
    return s?.provider?.unitId ?? null;
  }

  async getRewardUnit(rewardId: string): Promise<string | null> {
    const r = await this.prisma.reward.findUnique({
      where: { id: rewardId },
      select: { provider: { select: { unitId: true } } },
    });
    return r?.provider?.unitId ?? null;
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
    bio?: string;
  }) {
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
        bio: data.bio,
      },
    });

    // Auto-cria AuthUser com role=provider se email fornecido
    let tempPassword: string | null = null;
    if (data.email) {
      const existing = await this.prisma.authUser.findUnique({ where: { email: data.email } });
      if (!existing) {
        tempPassword = crypto.randomBytes(6).toString('base64url').slice(0, 10) + 'A1';
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

  async createService(providerId: string, data: {
    description: string;
    originalPrice: number;
    discountMinPercent?: number;
    discountMaxPercent?: number;
    insurancePrice?: number;
    discountedPrice?: number;
    discountType?: string;
    discountValue?: number;
  }) {
    const range = normalizeDiscountRange(data.discountMinPercent, data.discountMaxPercent);
    const originalPrice = Number(data.originalPrice) || 0;
    const discountedPrice = data.discountedPrice !== undefined
      ? Number(data.discountedPrice)
      : calcDiscounted(originalPrice, range.max);
    return this.prisma.service.create({
      data: {
        providerId,
        description: data.description,
        originalPrice,
        insurancePrice: data.insurancePrice ?? 0,
        discountedPrice,
        discountType: data.discountType ?? 'percentage',
        discountValue: data.discountValue ?? range.max ?? 0,
        discountMinPercent: range.min,
        discountMaxPercent: range.max,
      },
    });
  }

  async updateService(serviceId: string, data: {
    description?: string;
    originalPrice?: number;
    discountMinPercent?: number;
    discountMaxPercent?: number;
    insurancePrice?: number;
    discountedPrice?: number;
    discountType?: string;
    discountValue?: number;
  }) {
    const allowed: any = {};
    if (data.description !== undefined) allowed.description = data.description;
    if (data.originalPrice !== undefined) allowed.originalPrice = Number(data.originalPrice);
    if (data.insurancePrice !== undefined) allowed.insurancePrice = data.insurancePrice;
    if (data.discountType !== undefined) allowed.discountType = data.discountType;
    if (data.discountValue !== undefined) allowed.discountValue = data.discountValue;

    const hasRange = data.discountMinPercent !== undefined || data.discountMaxPercent !== undefined;
    if (hasRange) {
      const current = await this.prisma.service.findUnique({ where: { id: serviceId } });
      const range = normalizeDiscountRange(
        data.discountMinPercent ?? current?.discountMinPercent ?? undefined,
        data.discountMaxPercent ?? current?.discountMaxPercent ?? undefined,
      );
      allowed.discountMinPercent = range.min;
      allowed.discountMaxPercent = range.max;
      const originalPrice = allowed.originalPrice ?? Number(current?.originalPrice ?? 0);
      if (data.discountedPrice === undefined && range.max != null) {
        allowed.discountedPrice = calcDiscounted(originalPrice, range.max);
      }
    }

    if (data.discountedPrice !== undefined) allowed.discountedPrice = Number(data.discountedPrice);
    return this.prisma.service.update({ where: { id: serviceId }, data: allowed });
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
