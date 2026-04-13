import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
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
    const company = await this.prisma.company.create({ data });

    // Auto-cria o AuthUser de RH vinculado à empresa
    const tempPassword = crypto.randomBytes(6).toString('base64url').slice(0, 10) + 'A1';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const existingRh = await this.prisma.authUser.findUnique({ where: { email: data.adminEmail } });
    if (!existingRh) {
      await this.prisma.authUser.create({
        data: {
          email: data.adminEmail,
          passwordHash,
          role: 'rh',
          unitId: company.unitId,
          companyId: company.id,
        },
      });
    }

    return { ...company, tempPassword: existingRh ? null : tempPassword };
  }

  async update(id: string, data: { corporateName?: string; adminEmail?: string; status?: boolean }) {
    return this.prisma.company.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.company.update({ where: { id }, data: { status: false } });
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
