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
            { corporateName: { contains: search, mode: 'insensitive' as const } },
            { tradeName: { contains: search, mode: 'insensitive' as const } },
            { cnpj: { contains: search } },
            { city: { contains: search, mode: 'insensitive' as const } },
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

  async create(data: {
    unitId: string;
    externalCode?: string;
    corporateName: string;
    tradeName?: string;
    cnpj: string;
    adminEmail?: string;
    address?: string;
    neighborhood?: string;
    zipCode?: string;
    city?: string;
    state?: string;
    phone?: string;
    memberSince?: string;
  }) {
    const memberSince = data.memberSince ? new Date(data.memberSince) : undefined;

    const company = await this.prisma.company.create({
      data: {
        unitId: data.unitId,
        externalCode: data.externalCode || undefined,
        corporateName: data.corporateName,
        tradeName: data.tradeName || undefined,
        cnpj: data.cnpj,
        adminEmail: data.adminEmail || undefined,
        address: data.address || undefined,
        neighborhood: data.neighborhood || undefined,
        zipCode: data.zipCode || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        phone: data.phone || undefined,
        memberSince,
      },
    });

    // Auto-cria o AuthUser de RH vinculado à empresa (se tem email)
    let tempPassword: string | null = null;
    if (data.adminEmail) {
      const existingRh = await this.prisma.authUser.findUnique({ where: { email: data.adminEmail } });
      if (!existingRh) {
        tempPassword = crypto.randomBytes(6).toString('base64url').slice(0, 10) + 'A1';
        const passwordHash = await bcrypt.hash(tempPassword, 10);
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
    }

    return { ...company, tempPassword };
  }

  async update(id: string, data: {
    corporateName?: string;
    tradeName?: string;
    adminEmail?: string;
    address?: string;
    neighborhood?: string;
    zipCode?: string;
    city?: string;
    state?: string;
    phone?: string;
    externalCode?: string;
    memberSince?: string;
    status?: boolean;
  }) {
    const updateData: Record<string, unknown> = {};
    if (data.corporateName !== undefined) updateData.corporateName = data.corporateName;
    if (data.tradeName !== undefined) updateData.tradeName = data.tradeName;
    if (data.adminEmail !== undefined) updateData.adminEmail = data.adminEmail;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.neighborhood !== undefined) updateData.neighborhood = data.neighborhood;
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.externalCode !== undefined) updateData.externalCode = data.externalCode;
    if (data.memberSince !== undefined) updateData.memberSince = new Date(data.memberSince);
    if (data.status !== undefined) updateData.status = data.status;

    return this.prisma.company.update({ where: { id }, data: updateData });
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

  async importBatch(companies: Array<{
    unitId: string;
    externalCode?: string;
    corporateName: string;
    tradeName?: string;
    cnpj: string;
    adminEmail?: string;
    address?: string;
    neighborhood?: string;
    zipCode?: string;
    city?: string;
    state?: string;
    memberSince?: string;
  }>) {
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const c of companies) {
      try {
        const cnpjClean = c.cnpj.replace(/\D/g, '');
        if (!cnpjClean) {
          results.errors.push(`Empresa "${c.corporateName}": CNPJ vazio`);
          continue;
        }

        const existing = await this.prisma.company.findUnique({ where: { cnpj: cnpjClean } });
        if (existing) {
          results.skipped++;
          continue;
        }

        const memberSince = c.memberSince ? new Date(c.memberSince) : undefined;

        const company = await this.prisma.company.create({
          data: {
            unitId: c.unitId,
            externalCode: c.externalCode || undefined,
            corporateName: c.corporateName,
            tradeName: c.tradeName || undefined,
            cnpj: cnpjClean,
            adminEmail: c.adminEmail || undefined,
            address: c.address || undefined,
            neighborhood: c.neighborhood || undefined,
            zipCode: c.zipCode || undefined,
            city: c.city || undefined,
            state: c.state || undefined,
            memberSince,
          },
        });

        // Se tem adminEmail, cria AuthUser com role 'rh'
        if (c.adminEmail) {
          const existingAuth = await this.prisma.authUser.findUnique({ where: { email: c.adminEmail } });
          if (!existingAuth) {
            const tempPassword = crypto.randomBytes(6).toString('base64url').slice(0, 10) + 'A1';
            const passwordHash = await bcrypt.hash(tempPassword, 10);
            await this.prisma.authUser.create({
              data: {
                email: c.adminEmail,
                passwordHash,
                role: 'rh',
                unitId: company.unitId,
                companyId: company.id,
              },
            });
          }
        }

        results.created++;
      } catch {
        results.errors.push(`CNPJ ${c.cnpj}: erro ao importar`);
      }
    }

    return results;
  }
}
