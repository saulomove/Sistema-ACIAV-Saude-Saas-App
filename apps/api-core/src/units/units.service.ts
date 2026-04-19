import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.unit.findMany({
      include: {
        _count: { select: { users: true, companies: true, providers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.unit.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, companies: true, providers: true } },
      },
    });
  }

  async create(data: { name: string; subdomain: string; settings?: string }) {
    return this.prisma.unit.create({ data });
  }

  async update(id: string, data: {
    name?: string;
    subdomain?: string;
    settings?: string;
    status?: boolean;
    supportWhatsapp?: string | null;
    featuresRewards?: boolean;
  }) {
    const allowed: any = {};
    if (data.name !== undefined) allowed.name = data.name;
    if (data.subdomain !== undefined) allowed.subdomain = data.subdomain;
    if (data.settings !== undefined) allowed.settings = data.settings;
    if (data.status !== undefined) allowed.status = data.status;
    if (data.supportWhatsapp !== undefined) {
      const raw = typeof data.supportWhatsapp === 'string' ? data.supportWhatsapp.replace(/\D/g, '') : null;
      allowed.supportWhatsapp = raw ? raw : null;
    }
    if (data.featuresRewards !== undefined) allowed.featuresRewards = !!data.featuresRewards;
    return this.prisma.unit.update({ where: { id }, data: allowed });
  }

  async remove(id: string) {
    return this.prisma.unit.update({ where: { id }, data: { status: false } });
  }
}
