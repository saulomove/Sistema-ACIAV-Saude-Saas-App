import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll(unitId?: string, search?: string) {
    return this.prisma.company.findMany({
      where: {
        ...(unitId && { unitId }),
        ...(search && {
          OR: [
            { corporateName: { contains: search, mode: 'insensitive' } },
            { cnpj: { contains: search } },
          ],
        }),
      },
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
  }

  async create(data: { unitId: string; corporateName: string; cnpj: string; adminEmail: string }) {
    return this.prisma.company.create({ data });
  }

  async update(id: string, data: { corporateName?: string; adminEmail?: string; status?: boolean }) {
    return this.prisma.company.update({ where: { id }, data });
  }

  async stats(unitId: string) {
    const [total, active, totalUsers] = await Promise.all([
      this.prisma.company.count({ where: { unitId } }),
      this.prisma.company.count({ where: { unitId, status: true } }),
      this.prisma.user.count({ where: { unitId, status: true } }),
    ]);
    return { total, active, totalUsers };
  }
}
