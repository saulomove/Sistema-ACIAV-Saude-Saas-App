import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

const INACTIVATION_LOCK_DAYS = 30;

@Injectable()
export class PortalRhService {
  constructor(private prisma: PrismaService) {}

  private requireCompany(companyId: string | undefined) {
    if (!companyId) throw new ForbiddenException('Usuário RH sem empresa vinculada.');
    return companyId;
  }

  async getSummary(companyId: string | undefined, range?: { startDate?: string; endDate?: string }) {
    const cid = this.requireCompany(companyId);
    const start = range?.startDate ? new Date(range.startDate) : undefined;
    const end = range?.endDate ? new Date(range.endDate) : undefined;

    const txWhere: any = { user: { companyId: cid } };
    if (start || end) {
      txWhere.createdAt = {};
      if (start) txWhere.createdAt.gte = start;
      if (end) txWhere.createdAt.lte = end;
    }

    const [totalColaboradores, totalDependentes, totalTransacoes, totalSaved] = await Promise.all([
      this.prisma.user.count({ where: { companyId: cid, type: 'titular', status: true } }),
      this.prisma.user.count({ where: { companyId: cid, type: 'dependente', status: true } }),
      this.prisma.transaction.count({ where: txWhere }),
      this.prisma.transaction.aggregate({ where: txWhere, _sum: { amountSaved: true } }),
    ]);

    return {
      totalColaboradores,
      totalDependentes,
      totalVidas: totalColaboradores + totalDependentes,
      totalTransacoes,
      economiaTotal: Number(totalSaved._sum.amountSaved || 0),
    };
  }

  async listDependents(companyId: string | undefined) {
    const cid = this.requireCompany(companyId);
    return this.prisma.user.findMany({
      where: { companyId: cid, type: 'dependente' },
      include: {
        parent: { select: { id: true, fullName: true, cpf: true } },
      },
      orderBy: [{ status: 'desc' }, { fullName: 'asc' }],
    });
  }

  async listTitulares(companyId: string | undefined) {
    const cid = this.requireCompany(companyId);
    return this.prisma.user.findMany({
      where: { companyId: cid, type: 'titular', status: true },
      select: { id: true, fullName: true, cpf: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async createDependent(
    companyId: string | undefined,
    unitId: string,
    data: {
      parentId: string;
      fullName: string;
      cpf: string;
      birthDate?: string;
      kinship?: string;
      gender?: string;
      phone?: string;
    },
  ) {
    const cid = this.requireCompany(companyId);
    const fullName = (data.fullName || '').trim();
    const cpfClean = (data.cpf || '').replace(/\D/g, '');

    if (fullName.length < 3) throw new BadRequestException('Nome inválido.');
    if (cpfClean.length !== 11) throw new BadRequestException('CPF inválido.');
    if (!data.parentId) throw new BadRequestException('Titular obrigatório.');

    const parent = await this.prisma.user.findUnique({
      where: { id: data.parentId },
      select: { id: true, companyId: true, unitId: true, type: true, status: true },
    });
    if (!parent) throw new NotFoundException('Titular não encontrado.');
    if (parent.companyId !== cid || parent.unitId !== unitId) {
      throw new ForbiddenException('Titular não pertence à sua empresa.');
    }
    if (parent.type !== 'titular') {
      throw new BadRequestException('O usuário informado não é um titular.');
    }

    const existing = await this.prisma.user.findFirst({
      where: { cpf: cpfClean, unitId },
      select: { id: true, companyId: true, company: { select: { corporateName: true } } },
    });
    if (existing) {
      throw new BadRequestException({
        conflict: true,
        existingUserId: existing.id,
        existingCompany: existing.company?.corporateName,
        message: 'Este CPF já está cadastrado no sistema.',
      });
    }

    const birthDate = data.birthDate ? new Date(data.birthDate) : undefined;
    const dependent = await this.prisma.user.create({
      data: {
        unitId,
        companyId: cid,
        fullName,
        cpf: cpfClean,
        type: 'dependente',
        parentId: parent.id,
        kinship: data.kinship?.trim() || undefined,
        gender: data.gender?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        birthDate,
      },
    });

    const existingAuth = await this.prisma.authUser.findUnique({ where: { email: cpfClean } });
    if (!existingAuth) {
      const passwordHash = await bcrypt.hash(cpfClean, 10);
      await this.prisma.authUser.create({
        data: {
          email: cpfClean,
          passwordHash,
          role: 'patient',
          unitId,
          companyId: cid,
          userId: dependent.id,
        },
      });
    }

    return dependent;
  }

  async updateDependent(
    companyId: string | undefined,
    unitId: string,
    id: string,
    data: {
      fullName?: string;
      kinship?: string;
      gender?: string;
      phone?: string;
      birthDate?: string;
    },
  ) {
    const cid = this.requireCompany(companyId);
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing || existing.companyId !== cid || existing.unitId !== unitId) {
      throw new ForbiddenException('Acesso negado.');
    }
    if (existing.type !== 'dependente') {
      throw new BadRequestException('Este endpoint só edita dependentes.');
    }

    const updateData: Record<string, unknown> = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName.trim();
    if (data.kinship !== undefined) updateData.kinship = data.kinship.trim() || null;
    if (data.gender !== undefined) updateData.gender = data.gender.trim() || null;
    if (data.phone !== undefined) updateData.phone = data.phone.trim() || null;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;

    return this.prisma.user.update({ where: { id }, data: updateData });
  }

  async inactivateMember(
    companyId: string | undefined,
    unitId: string,
    id: string,
    reason: string,
  ) {
    const cid = this.requireCompany(companyId);
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing || existing.companyId !== cid || existing.unitId !== unitId) {
      throw new ForbiddenException('Acesso negado.');
    }
    const trimmed = (reason ?? '').trim();
    if (trimmed.length < 3) throw new BadRequestException('Motivo obrigatório.');

    const now = new Date();
    const lockUntil = new Date(now.getTime() + INACTIVATION_LOCK_DAYS * 24 * 60 * 60 * 1000);
    return this.prisma.user.update({
      where: { id },
      data: {
        status: false,
        inactivationReason: trimmed,
        inactivatedAt: now,
        inactivationLockUntil: lockUntil,
      },
    });
  }

  async listProviders(unitId: string, filters: { city?: string; category?: string }) {
    return this.prisma.provider.findMany({
      where: {
        unitId,
        status: true,
        ...(filters.city ? { city: { equals: filters.city, mode: 'insensitive' } } : {}),
        ...(filters.category ? { category: { equals: filters.category, mode: 'insensitive' } } : {}),
      },
      select: {
        id: true,
        name: true,
        clinicName: true,
        category: true,
        specialty: true,
        city: true,
        address: true,
        phone: true,
        whatsapp: true,
        email: true,
        photoUrl: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async listProviderCities(unitId: string) {
    const rows = await this.prisma.provider.findMany({
      where: { unitId, NOT: { city: null } },
      select: { city: true },
      distinct: ['city'],
    });
    return rows.map((r) => r.city).filter((c): c is string => !!c).sort();
  }

  async listCompanyColaboradores(
    companyId: string | undefined,
    range?: { startDate?: string; endDate?: string },
  ) {
    const cid = this.requireCompany(companyId);
    const users = await this.prisma.user.findMany({
      where: { companyId: cid },
      include: {
        _count: { select: { dependents: true } },
      },
      orderBy: [{ status: 'desc' }, { fullName: 'asc' }],
    });

    if (!range?.startDate && !range?.endDate) return users;
    return users;
  }
}
