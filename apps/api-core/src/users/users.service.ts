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
}
