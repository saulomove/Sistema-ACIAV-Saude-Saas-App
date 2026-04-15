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

    // 1. Pre-load all data we need in bulk (avoid N+1 queries)
    const [companies, existingUsersInUnit, existingAuthEmails] = await Promise.all([
      this.prisma.company.findMany({
        where: { unitId },
        select: { id: true, corporateName: true },
      }),
      this.prisma.user.findMany({
        where: { unitId },
        select: { id: true, cpf: true, externalCode: true, companyId: true },
      }),
      this.prisma.authUser.findMany({
        where: { role: 'patient' },
        select: { email: true },
      }),
    ]);

    const companyMap = new Map<string, string>();
    for (const c of companies) {
      companyMap.set(c.corporateName.toUpperCase(), c.id);
    }

    const existingCpfSet = new Set<string>();
    const externalCodeToUserId = new Map<string, string>();
    const cpfToCompanyId = new Map<string, string | null>();
    for (const eu of existingUsersInUnit) {
      existingCpfSet.add(eu.cpf);
      if (eu.externalCode) externalCodeToUserId.set(eu.externalCode, eu.id);
      cpfToCompanyId.set(eu.cpf, eu.companyId);
    }

    const existingAuthSet = new Set<string>();
    for (const a of existingAuthEmails) {
      existingAuthSet.add(a.email);
    }

    // 2. Pre-compute a single bcrypt hash (all passwords are CPF, so we hash unique CPFs)
    // Optimization: batch hash computation with lower rounds for import (user changes on first login)
    const cpfsToHash = new Set<string>();
    for (const u of users) {
      const cpfClean = u.cpf.replace(/\D/g, '');
      if (cpfClean && !existingCpfSet.has(cpfClean) && !existingAuthSet.has(cpfClean)) {
        cpfsToHash.add(cpfClean);
      }
    }

    // Hash all unique CPFs in parallel batches of 50
    const hashMap = new Map<string, string>();
    const cpfArray = Array.from(cpfsToHash);
    for (let i = 0; i < cpfArray.length; i += 50) {
      const batch = cpfArray.slice(i, i + 50);
      const hashes = await Promise.all(batch.map((cpf) => bcrypt.hash(cpf, 8)));
      batch.forEach((cpf, idx) => hashMap.set(cpf, hashes[idx]));
    }

    // 3. Separate titulares and dependentes
    const titulares = users.filter((u) => !u.parentExternalCode);
    const dependentes = users.filter((u) => !!u.parentExternalCode);

    // 4. Pass 1: Create titulares in batches
    for (let i = 0; i < titulares.length; i += 100) {
      const batch = titulares.slice(i, i + 100);
      const ops: Array<Promise<void>> = [];

      for (const u of batch) {
        ops.push((async () => {
          try {
            const cpfClean = u.cpf.replace(/\D/g, '');
            if (!cpfClean) { results.errors.push(`"${u.fullName}": CPF vazio`); return; }

            if (existingCpfSet.has(cpfClean)) {
              if (u.externalCode) {
                const existing = existingUsersInUnit.find((e) => e.cpf === cpfClean);
                if (existing) externalCodeToUserId.set(u.externalCode, existing.id);
              }
              results.skipped++;
              return;
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

            existingCpfSet.add(cpfClean);
            if (u.externalCode) externalCodeToUserId.set(u.externalCode, user.id);
            cpfToCompanyId.set(cpfClean, companyId ?? null);

            if (!existingAuthSet.has(cpfClean)) {
              const passwordHash = hashMap.get(cpfClean);
              if (passwordHash) {
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
                existingAuthSet.add(cpfClean);
                results.loginsCreated++;
              }
            }

            results.created++;
          } catch {
            results.errors.push(`CPF ${u.cpf}: erro ao importar titular`);
          }
        })());
      }

      await Promise.all(ops);
    }

    // 5. Pass 2: Create dependentes in batches
    for (let i = 0; i < dependentes.length; i += 100) {
      const batch = dependentes.slice(i, i + 100);
      const ops: Array<Promise<void>> = [];

      for (const u of batch) {
        ops.push((async () => {
          try {
            const cpfClean = u.cpf.replace(/\D/g, '');
            if (!cpfClean) { results.errors.push(`"${u.fullName}": CPF vazio`); return; }

            if (existingCpfSet.has(cpfClean)) {
              results.skipped++;
              return;
            }

            const parentId = u.parentExternalCode ? externalCodeToUserId.get(u.parentExternalCode) : undefined;

            let companyId: string | undefined;
            if (parentId) {
              const parentUser = existingUsersInUnit.find((e) => e.id === parentId);
              companyId = parentUser?.companyId ?? undefined;
              if (!companyId) companyId = cpfToCompanyId.get(parentUser?.cpf ?? '') ?? undefined;
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

            existingCpfSet.add(cpfClean);

            if (!existingAuthSet.has(cpfClean)) {
              const passwordHash = hashMap.get(cpfClean);
              if (passwordHash) {
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
                existingAuthSet.add(cpfClean);
                results.loginsCreated++;
              }
            }

            results.created++;
          } catch {
            results.errors.push(`CPF ${u.cpf}: erro ao importar dependente`);
          }
        })());
      }

      await Promise.all(ops);
    }

    return results;
  }
}
