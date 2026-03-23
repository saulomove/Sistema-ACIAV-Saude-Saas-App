import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(unitId?: string, companyId?: string, search?: string, type?: string) {
    return this.prisma.user.findMany({
      where: {
        ...(unitId && { unitId }),
        ...(companyId && { companyId }),
        ...(type && { type }),
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { cpf: { contains: search } },
          ],
        }),
      },
      include: {
        company: { select: { corporateName: true } },
        _count: { select: { dependents: true, transactions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        company: true,
        dependents: true,
        _count: { select: { transactions: true } },
      },
    });
  }

  async create(data: {
    unitId: string;
    companyId?: string;
    fullName: string;
    cpf: string;
    type: string;
    parentId?: string;
  }) {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: { fullName?: string; status?: boolean; companyId?: string }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async validateUserByCpf(cpf: string, unitId: string) {
    if (!cpf || !unitId) throw new BadRequestException('CPF e unitId são obrigatórios');

    const user = await this.prisma.user.findFirst({
      where: { cpf, unitId, status: true },
      include: { dependents: true, company: true },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado ou inativo nesta unidade');
    return user;
  }

  async remove(id: string) {
    return this.prisma.user.update({ where: { id }, data: { status: false } });
  }

  async getUserTransactions(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: {
        provider: { select: { name: true, category: true } },
        service: { select: { description: true, originalPrice: true, discountedPrice: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPatientCard(userId: string) {
    if (!userId) return null;
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: { select: { corporateName: true } },
        dependents: { select: { id: true, fullName: true, cpf: true, type: true, status: true } },
        _count: { select: { transactions: true } },
      },
    });
  }

  async importBatch(users: Array<{ unitId: string; companyId: string; fullName: string; cpf: string; type: string }>) {
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const u of users) {
      try {
        const existing = await this.prisma.user.findFirst({ where: { cpf: u.cpf, unitId: u.unitId } });
        if (existing) {
          results.skipped++;
          continue;
        }
        await this.prisma.user.create({ data: { ...u, type: u.type || 'titular' } });
        results.created++;
      } catch {
        results.errors.push(`CPF ${u.cpf}: erro ao importar`);
      }
    }

    return results;
  }
}
