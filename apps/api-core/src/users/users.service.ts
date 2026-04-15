import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(unitId?: string, companyId?: string, search?: string, type?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where = {
      ...(unitId && { unitId }),
      ...(companyId && { companyId }),
      ...(type && { type }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' as const } },
          { cpf: { contains: search } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          company: { select: { corporateName: true } },
          parent: { select: { fullName: true } },
          _count: { select: { dependents: true, transactions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        company: true,
        parent: { select: { id: true, fullName: true, cpf: true } },
        dependents: true,
        _count: { select: { transactions: true } },
      },
    });
  }

  async create(data: {
    unitId: string;
    companyId?: string;
    externalCode?: string;
    fullName: string;
    cpf: string;
    type: string;
    parentId?: string;
    gender?: string;
    birthDate?: string;
    phone?: string;
    kinship?: string;
    billingName?: string;
    memberSince?: string;
  }) {
    const birthDate = data.birthDate ? new Date(data.birthDate) : undefined;
    const memberSince = data.memberSince ? new Date(data.memberSince) : undefined;
    const cpfClean = data.cpf.replace(/\D/g, '');

    const user = await this.prisma.user.create({
      data: {
        unitId: data.unitId,
        companyId: data.companyId || undefined,
        externalCode: data.externalCode || undefined,
        fullName: data.fullName,
        cpf: cpfClean,
        type: data.type || 'titular',
        parentId: data.parentId || undefined,
        gender: data.gender || undefined,
        birthDate,
        phone: data.phone || undefined,
        kinship: data.kinship || undefined,
        billingName: data.billingName || undefined,
        memberSince,
      },
    });

    // Auto-cria AuthUser com login=CPF, senha=CPF (role 'patient')
    let loginCreated = false;
    const existingAuth = await this.prisma.authUser.findUnique({ where: { email: cpfClean } });
    if (!existingAuth) {
      const passwordHash = await bcrypt.hash(cpfClean, 10);
      await this.prisma.authUser.create({
        data: {
          email: cpfClean,
          passwordHash,
          role: 'patient',
          unitId: data.unitId,
          companyId: data.companyId || undefined,
          userId: user.id,
        },
      });
      loginCreated = true;
    }

    return { ...user, loginCreated };
  }

  async update(id: string, data: {
    fullName?: string;
    status?: boolean;
    companyId?: string;
    phone?: string;
    gender?: string;
    kinship?: string;
    billingName?: string;
    externalCode?: string;
    birthDate?: string;
    memberSince?: string;
  }) {
    const updateData: Record<string, unknown> = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.companyId !== undefined) updateData.companyId = data.companyId;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.kinship !== undefined) updateData.kinship = data.kinship;
    if (data.billingName !== undefined) updateData.billingName = data.billingName;
    if (data.externalCode !== undefined) updateData.externalCode = data.externalCode;
    if (data.birthDate !== undefined) updateData.birthDate = new Date(data.birthDate);
    if (data.memberSince !== undefined) updateData.memberSince = new Date(data.memberSince);
    return this.prisma.user.update({ where: { id }, data: updateData });
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

  async importBatch(
    unitId: string,
    users: Array<{
      externalCode?: string;
      fullName: string;
      cpf: string;
      type: string;
      parentExternalCode?: string;
      proponentName?: string;
      gender?: string;
      birthDate?: string;
      phone?: string;
      kinship?: string;
      billingName?: string;
      memberSince?: string;
    }>,
  ) {
    const results = { created: 0, skipped: 0, errors: [] as string[], loginsCreated: 0 };

    // Build company lookup by corporateName (case-insensitive)
    const companies = await this.prisma.company.findMany({
      where: { unitId },
      select: { id: true, corporateName: true },
    });
    const companyMap = new Map<string, string>();
    for (const c of companies) {
      companyMap.set(c.corporateName.toUpperCase(), c.id);
    }

    // Separate titulares and dependentes
    const titulares = users.filter((u) => !u.parentExternalCode);
    const dependentes = users.filter((u) => !!u.parentExternalCode);

    // Map externalCode → userId (for linking dependentes)
    const externalCodeToUserId = new Map<string, string>();

    // Also load existing users with externalCode (in case some titulares already exist)
    const existingUsers = await this.prisma.user.findMany({
      where: { unitId, externalCode: { not: null } },
      select: { id: true, externalCode: true },
    });
    for (const eu of existingUsers) {
      if (eu.externalCode) externalCodeToUserId.set(eu.externalCode, eu.id);
    }

    // Pass 1: Create titulares
    for (const u of titulares) {
      try {
        const cpfClean = u.cpf.replace(/\D/g, '');
        if (!cpfClean) { results.errors.push(`"${u.fullName}": CPF vazio`); continue; }

        const existing = await this.prisma.user.findFirst({ where: { cpf: cpfClean, unitId } });
        if (existing) {
          // Still map externalCode for dependents linking
          if (u.externalCode && existing.id) externalCodeToUserId.set(u.externalCode, existing.id);
          results.skipped++;
          continue;
        }

        const companyId = u.proponentName ? companyMap.get(u.proponentName.toUpperCase()) : undefined;
        const birthDate = u.birthDate ? new Date(u.birthDate) : undefined;
        const memberSince = u.memberSince ? new Date(u.memberSince) : undefined;

        const user = await this.prisma.user.create({
          data: {
            unitId,
            companyId: companyId || undefined,
            externalCode: u.externalCode || undefined,
            fullName: u.fullName,
            cpf: cpfClean,
            type: 'titular',
            gender: u.gender || undefined,
            birthDate,
            phone: u.phone || undefined,
            kinship: u.kinship || undefined,
            billingName: u.billingName || undefined,
            memberSince,
          },
        });

        if (u.externalCode) externalCodeToUserId.set(u.externalCode, user.id);

        // Create AuthUser login (CPF/CPF)
        const existingAuth = await this.prisma.authUser.findUnique({ where: { email: cpfClean } });
        if (!existingAuth) {
          const passwordHash = await bcrypt.hash(cpfClean, 10);
          await this.prisma.authUser.create({
            data: {
              email: cpfClean,
              passwordHash,
              role: 'patient',
              unitId,
              companyId: companyId || undefined,
              userId: user.id,
            },
          });
          results.loginsCreated++;
        }

        results.created++;
      } catch {
        results.errors.push(`CPF ${u.cpf}: erro ao importar titular`);
      }
    }

    // Pass 2: Create dependentes
    for (const u of dependentes) {
      try {
        const cpfClean = u.cpf.replace(/\D/g, '');
        if (!cpfClean) { results.errors.push(`"${u.fullName}": CPF vazio`); continue; }

        const existing = await this.prisma.user.findFirst({ where: { cpf: cpfClean, unitId } });
        if (existing) {
          results.skipped++;
          continue;
        }

        // Find parent by externalCode
        const parentId = u.parentExternalCode ? externalCodeToUserId.get(u.parentExternalCode) : undefined;

        // Get companyId from parent if available, or from proponentName
        let companyId: string | undefined;
        if (parentId) {
          const parent = await this.prisma.user.findUnique({ where: { id: parentId }, select: { companyId: true } });
          companyId = parent?.companyId ?? undefined;
        }
        if (!companyId && u.proponentName) {
          companyId = companyMap.get(u.proponentName.toUpperCase());
        }

        const birthDate = u.birthDate ? new Date(u.birthDate) : undefined;
        const memberSince = u.memberSince ? new Date(u.memberSince) : undefined;

        const user = await this.prisma.user.create({
          data: {
            unitId,
            companyId: companyId || undefined,
            externalCode: u.externalCode || undefined,
            fullName: u.fullName,
            cpf: cpfClean,
            type: 'dependente',
            parentId: parentId || undefined,
            gender: u.gender || undefined,
            birthDate,
            phone: u.phone || undefined,
            kinship: u.kinship || undefined,
            billingName: u.billingName || undefined,
            memberSince,
          },
        });

        // Create AuthUser login (CPF/CPF) for dependente too
        const existingAuth = await this.prisma.authUser.findUnique({ where: { email: cpfClean } });
        if (!existingAuth) {
          const passwordHash = await bcrypt.hash(cpfClean, 10);
          await this.prisma.authUser.create({
            data: {
              email: cpfClean,
              passwordHash,
              role: 'patient',
              unitId,
              companyId: companyId || undefined,
              userId: user.id,
            },
          });
          results.loginsCreated++;
        }

        results.created++;
      } catch {
        results.errors.push(`CPF ${u.cpf}: erro ao importar dependente`);
      }
    }

    return results;
  }
}
