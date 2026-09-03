import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

// Campos obrigatórios para a cobrança (exportação financeiro) — decisão ACIAV 2026-09-02.
const REQUIRED_COMPANY_FIELDS: Array<[keyof CompanyRequired, string]> = [
  ['externalCode', 'Código externo (financeiro) é obrigatório.'],
  ['address', 'Endereço é obrigatório.'],
  ['neighborhood', 'Bairro é obrigatório.'],
  ['zipCode', 'CEP é obrigatório.'],
  ['city', 'Cidade é obrigatória.'],
  ['state', 'UF é obrigatória.'],
  ['planName', 'Tabela de preço (plano) é obrigatória.'],
];
type CompanyRequired = {
  externalCode?: string; address?: string; neighborhood?: string;
  zipCode?: string; city?: string; state?: string; planName?: string;
};

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  private assertRequiredCompanyFields(data: CompanyRequired & { planValue?: number | string }) {
    for (const [key, msg] of REQUIRED_COMPANY_FIELDS) {
      if (!(data[key] ?? '').toString().trim()) throw new BadRequestException(msg);
    }
    const v = Number(data.planValue);
    if (data.planValue === undefined || data.planValue === '' || !Number.isFinite(v) || v <= 0) {
      throw new BadRequestException('Valor por usuário do plano é obrigatório (maior que zero).');
    }
  }

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
    dependentPaymentMode?: string;
    defaultCardType?: string;
    planName?: string;
    planValue?: number | string;
  }) {
    if (!(data.corporateName ?? '').trim()) throw new BadRequestException('Razão social é obrigatória.');
    if (!(data.cnpj ?? '').replace(/\D/g, '')) throw new BadRequestException('CNPJ é obrigatório.');
    this.assertRequiredCompanyFields(data);
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
        dependentPaymentMode: data.dependentPaymentMode || undefined,
        defaultCardType: data.defaultCardType || undefined,
        planName: data.planName?.trim() || undefined,
        planValue:
          data.planValue !== undefined && data.planValue !== '' && Number.isFinite(Number(data.planValue))
            ? Number(data.planValue)
            : undefined,
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
    dependentPaymentMode?: string;
    defaultCardType?: string;
    planName?: string | null;
    planValue?: number | string | null;
  }) {
    // Campos obrigatórios da cobrança não podem ser esvaziados na edição.
    const noBlank: Array<[unknown, string]> = [
      [data.externalCode, 'Código externo (financeiro) não pode ficar vazio.'],
      [data.address, 'Endereço não pode ficar vazio.'],
      [data.neighborhood, 'Bairro não pode ficar vazio.'],
      [data.zipCode, 'CEP não pode ficar vazio.'],
      [data.city, 'Cidade não pode ficar vazia.'],
      [data.state, 'UF não pode ficar vazia.'],
      [data.planName, 'Tabela de preço (plano) não pode ficar vazia.'],
      [data.planValue, 'Valor por usuário do plano não pode ficar vazio.'],
    ];
    for (const [val, msg] of noBlank) {
      if (val !== undefined && !(val ?? '').toString().trim()) throw new BadRequestException(msg);
    }
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
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === true) {
        updateData.inactivationReason = null;
        updateData.inactivatedAt = null;
      }
    }
    if (data.dependentPaymentMode !== undefined) {
      const v = (data.dependentPaymentMode || 'titular').toLowerCase();
      updateData.dependentPaymentMode = ['titular', 'empresa'].includes(v) ? v : 'titular';
    }
    if (data.defaultCardType !== undefined) {
      const v = (data.defaultCardType || 'app').toLowerCase();
      updateData.defaultCardType = ['app', 'physical'].includes(v) ? v : 'app';
    }
    if (data.planName !== undefined) {
      updateData.planName = (data.planName ?? '').toString().trim() || null;
    }
    if (data.planValue !== undefined) {
      const raw = data.planValue;
      updateData.planValue =
        raw === null || raw === '' || !Number.isFinite(Number(raw)) ? null : Number(raw);
    }

    return this.prisma.company.update({ where: { id }, data: updateData });
  }

  async inactivate(id: string, reason: string) {
    const clean = (reason || '').trim();
    if (clean.length < 3) {
      throw new Error('Motivo da inativação é obrigatório (mínimo 3 caracteres).');
    }
    return this.prisma.company.update({
      where: { id },
      data: {
        status: false,
        inactivationReason: clean,
        inactivatedAt: new Date(),
      },
    });
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
    planName?: string;
    planValue?: number | string;
  }>) {
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const c of companies) {
      try {
        const cnpjClean = c.cnpj.replace(/\D/g, '');
        if (!cnpjClean) {
          results.errors.push(`Empresa "${c.corporateName}": CNPJ vazio`);
          continue;
        }
        try {
          this.assertRequiredCompanyFields(c);
        } catch (e) {
          results.errors.push(`Empresa "${c.corporateName}": ${e instanceof BadRequestException ? (e.getResponse() as any)?.message ?? e.message : 'dados obrigatórios ausentes'}`);
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
            planName: c.planName?.trim() || undefined,
            planValue: Number.isFinite(Number(c.planValue)) ? Number(c.planValue) : undefined,
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
