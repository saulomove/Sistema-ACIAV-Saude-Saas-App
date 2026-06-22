import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ExportFilters = {
  unitId?: string;
  companyId?: string;
  providerId?: string;
  startDate?: string;
  endDate?: string;
};

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportUsers(filters: ExportFilters): Promise<Buffer> {
    const where: Prisma.UserWhereInput = {};
    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.companyId) where.companyId = filters.companyId;

    const users = await this.prisma.user.findMany({
      where,
      include: { company: true, parent: true },
      orderBy: { fullName: 'asc' },
    });

    const rows = users.map((u) => ({
      'Código Cliente': u.externalCode ?? '',
      'Nome Completo': u.fullName,
      'CPF': u.cpf,
      'Tipo': u.type,
      'Titular': u.parent?.fullName ?? '',
      'Parentesco': u.kinship ?? '',
      'Sexo': u.gender ?? '',
      'Data Nascimento': u.birthDate ? this.formatDate(u.birthDate) : '',
      'Telefone': u.phone ?? '',
      'Email': u.email ?? '',
      'WhatsApp': u.whatsapp ?? '',
      'Empresa': u.company?.corporateName ?? '',
      'Cliente Cobrança': u.billingName ?? '',
      'Data Inclusão': u.memberSince ? this.formatDate(u.memberSince) : '',
      'Ativo': u.status ? 'Sim' : 'Não',
    }));

    return this.buildWorkbook(rows, 'Beneficiarios');
  }

  async exportCompanies(filters: ExportFilters): Promise<Buffer> {
    const where: Prisma.CompanyWhereInput = {};
    if (filters.unitId) where.unitId = filters.unitId;

    const companies = await this.prisma.company.findMany({
      where,
      include: { _count: { select: { users: true } } },
      orderBy: { corporateName: 'asc' },
    });

    const rows = companies.map((c) => ({
      'Código': c.externalCode ?? '',
      'Razão Social': c.corporateName,
      'Nome Fantasia': c.tradeName ?? '',
      'CNPJ': c.cnpj,
      'Email Admin': c.adminEmail ?? '',
      'Telefone': c.phone ?? '',
      'Cidade': c.city ?? '',
      'Estado': c.state ?? '',
      'Beneficiários': c._count.users,
      'Paga Dependentes': c.dependentPaymentMode === 'empresa' ? 'Empresa' : 'Titular',
      'Cartão Padrão': c.defaultCardType === 'physical' ? 'Físico' : 'App',
      'Ativa': c.status ? 'Sim' : 'Não',
      'Data Adesão': c.memberSince ? this.formatDate(c.memberSince) : '',
    }));

    return this.buildWorkbook(rows, 'Empresas');
  }

  async exportTransactions(filters: ExportFilters): Promise<Buffer> {
    const where: Prisma.TransactionWhereInput = {};
    const userFilter: Prisma.UserWhereInput = {};
    if (filters.unitId) userFilter.unitId = filters.unitId;
    if (filters.companyId) userFilter.companyId = filters.companyId;
    if (Object.keys(userFilter).length > 0) where.user = userFilter;
    if (filters.providerId) where.providerId = filters.providerId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        user: { include: { company: true } },
        provider: true,
        service: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = transactions.map((t) => ({
      'Data': this.formatDate(t.createdAt),
      'Paciente': t.user.fullName,
      'CPF': t.user.cpf,
      'Empresa': t.user.company?.corporateName ?? '',
      'Credenciado': t.provider.name,
      'Serviço': t.service.description,
      'Valor Original': Number(t.service.originalPrice),
      'Valor Economizado': Number(t.amountSaved),
      'Confirmado Paciente': t.confirmedByUser ? 'Sim' : 'Não',
      'Avaliação': t.rating ?? '',
    }));

    const totalSaved = rows.reduce((acc, r) => acc + (typeof r['Valor Economizado'] === 'number' ? r['Valor Economizado'] : 0), 0);
    rows.push({
      'Data': 'TOTAL',
      'Paciente': '',
      'CPF': '',
      'Empresa': '',
      'Credenciado': '',
      'Serviço': '',
      'Valor Original': '' as unknown as number,
      'Valor Economizado': totalSaved,
      'Confirmado Paciente': '',
      'Avaliação': '',
    });

    return this.buildWorkbook(rows, 'Transacoes');
  }

  async exportProviders(filters: ExportFilters): Promise<Buffer> {
    const where: Prisma.ProviderWhereInput = {};
    if (filters.unitId) where.unitId = filters.unitId;

    const providers = await this.prisma.provider.findMany({
      where,
      include: { _count: { select: { services: true, transactions: true } } },
      orderBy: { name: 'asc' },
    });

    const rows = providers.map((p) => ({
      'Nome': p.name,
      'Clínica': p.clinicName ?? '',
      'Categoria': p.category,
      'Especialidade': p.specialty ?? '',
      'Registro': p.registration ?? '',
      'CPF/CNPJ': p.cpfCnpj ?? '',
      'Cidade': p.city ?? '',
      'Telefone': p.phone ?? '',
      'WhatsApp': p.whatsapp ?? '',
      'Email': p.email ?? '',
      'Serviços Cadastrados': p._count.services,
      'Atendimentos': p._count.transactions,
      'Ativo': p.status ? 'Sim' : 'Não',
    }));

    return this.buildWorkbook(rows, 'Credenciados');
  }

  async exportRedeCredenciada(
    filters: ExportFilters & { category?: string; city?: string; status?: string },
  ): Promise<Buffer> {
    const where: Prisma.ProviderWhereInput = {};
    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.category) where.category = filters.category;
    if (filters.city) where.city = { equals: filters.city, mode: 'insensitive' as const };
    if (filters.status === 'inactive') where.status = false;
    else if (filters.status !== 'all') where.status = true;

    const providers = await this.prisma.provider.findMany({
      where,
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
    });

    const rows = providers.map((p) => ({
      'Nome': p.professionalName?.trim() || p.clinicName?.trim() || p.name,
      'Tipo': this.deriveEntityLabel(p),
      'Especialidade': p.specialty ?? '',
      'Registro': p.registration ?? '',
      'Cidade': p.city ?? '',
      'Endereço': p.address ?? '',
      'Telefone': p.phone ?? '',
      'WhatsApp': p.whatsapp ?? '',
      'Email': p.email ?? '',
      'Horário de Atendimento': p.businessHours ?? '',
      'Status': p.status ? 'Ativo' : 'Inativo',
    }));

    return this.buildWorkbook(rows, 'Rede Credenciada');
  }

  private deriveEntityLabel(p: { professionalName?: string | null; category?: string | null }): string {
    if (p.professionalName?.trim()) return 'Profissional';
    const c = (p.category ?? '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    if (c.includes('farmacia')) return 'Farmácia';
    if (c.includes('hospital')) return 'Hospital';
    if (c.includes('exames laboratoriais') || c.includes('laboratorio')) return 'Laboratório';
    if (c.includes('otica') || c.includes('produtos naturais') || c.includes('suplementos')) return 'Loja';
    if (c.includes('academia')) return 'Academia';
    if (c.includes('estetica') || c.includes('bem-estar')) return 'Bem-estar';
    return 'Clínica';
  }

  async exportProvidersServices(
    filters: ExportFilters & { category?: string; city?: string; status?: string },
  ): Promise<Buffer> {
    const where: Prisma.ProviderWhereInput = {};
    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.category) where.category = filters.category;
    if (filters.city) where.city = { equals: filters.city, mode: 'insensitive' as const };
    if (filters.status === 'active') where.status = true;
    else if (filters.status === 'inactive') where.status = false;

    const providers = await this.prisma.provider.findMany({
      where,
      include: { services: true },
      orderBy: { name: 'asc' },
    });

    const rows: Record<string, unknown>[] = [];

    for (const p of providers) {
      const displayName = p.professionalName?.trim() || p.clinicName?.trim() || p.name;
      const base = {
        'Nome': displayName,
        'Categoria': p.category ?? '',
        'Especialidade': p.specialty ?? '',
        'Cidade': p.city ?? '',
        'Status': p.status ? 'Ativo' : 'Inativo',
      };
      if (p.services.length === 0) {
        rows.push({ ...base, 'Serviço': '—', 'Preço Original': '—', 'Preço ACIAV': '—', 'Desconto': '—' });
      } else {
        for (const s of p.services) {
          const orig = Number(s.originalPrice);
          const disc = Number(s.discountedPrice);
          rows.push({
            ...base,
            'Serviço': s.description,
            'Preço Original': orig > 0 ? this.formatCurrency(orig) : '—',
            'Preço ACIAV': disc > 0 ? this.formatCurrency(disc) : '—',
            'Desconto': this.formatDiscount(s),
          });
        }
      }
    }

    return this.buildWorkbook(rows, 'Catalogo');
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  private formatDiscount(s: {
    discountMinPercent?: number | null;
    discountMaxPercent?: number | null;
    discountType?: string | null;
    discountValue?: any;
    originalPrice?: any;
    discountedPrice?: any;
  }): string {
    if (s.discountMinPercent != null || s.discountMaxPercent != null) {
      const min = s.discountMinPercent ?? s.discountMaxPercent!;
      const max = s.discountMaxPercent ?? s.discountMinPercent!;
      return min === max ? `${min}%` : `${min}%–${max}%`;
    }
    if (s.discountType === 'percentage' && Number(s.discountValue ?? 0) > 0) {
      return `${Math.round(Number(s.discountValue))}%`;
    }
    const orig = Number(s.originalPrice ?? 0);
    const disc = Number(s.discountedPrice ?? 0);
    if (orig > 0 && disc > 0 && disc < orig) {
      return `${Math.round(((orig - disc) / orig) * 100)}%`;
    }
    return '—';
  }

  private buildWorkbook(rows: Record<string, unknown>[], sheetName: string): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async exportFullUnit(unitId: string): Promise<Buffer> {
    const [users, companies, providers, transactions, auditLogs] = await Promise.all([
      this.prisma.user.findMany({ where: { unitId }, include: { company: true, parent: true }, orderBy: { fullName: 'asc' } }),
      this.prisma.company.findMany({ where: { unitId }, orderBy: { corporateName: 'asc' } }),
      this.prisma.provider.findMany({ where: { unitId }, orderBy: { name: 'asc' } }),
      this.prisma.transaction.findMany({ where: { user: { unitId } }, include: { user: true, provider: true, service: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.findMany({ where: { unitId }, orderBy: { createdAt: 'desc' }, take: 5000 }),
    ]);

    const userRows = users.map((u) => ({
      ID: u.id,
      Nome: u.fullName,
      CPF: u.cpf,
      Tipo: u.type,
      Email: u.email ?? '',
      WhatsApp: u.whatsapp ?? '',
      Empresa: u.company?.corporateName ?? '',
      Titular: u.parent?.fullName ?? '',
      Ativo: u.status ? 'Sim' : 'Não',
      CriadoEm: this.formatDate(u.createdAt),
    }));
    const companyRows = companies.map((c) => ({
      ID: c.id,
      RazaoSocial: c.corporateName,
      NomeFantasia: c.tradeName ?? '',
      CNPJ: c.cnpj,
      EmailAdmin: c.adminEmail ?? '',
      Cidade: c.city ?? '',
      Ativa: c.status ? 'Sim' : 'Não',
      CriadoEm: this.formatDate(c.createdAt),
    }));
    const providerRows = providers.map((p) => ({
      ID: p.id,
      Nome: p.name,
      Categoria: p.category,
      CPFCNPJ: p.cpfCnpj ?? '',
      Cidade: p.city ?? '',
      Telefone: p.phone ?? '',
      Email: p.email ?? '',
      Ativo: p.status ? 'Sim' : 'Não',
      CriadoEm: this.formatDate(p.createdAt),
    }));
    const transactionRows = transactions.map((t) => ({
      Data: this.formatDate(t.createdAt),
      PacienteID: t.user.id,
      Paciente: t.user.fullName,
      CredenciadoID: t.provider.id,
      Credenciado: t.provider.name,
      Servico: t.service.description,
      ValorOriginal: Number(t.service.originalPrice),
      ValorEconomizado: Number(t.amountSaved),
      ConfirmadoPaciente: t.confirmedByUser ? 'Sim' : 'Não',
      Avaliacao: t.rating ?? '',
    }));
    const auditRows = auditLogs.map((a) => ({
      Data: this.formatDate(a.createdAt),
      Ator: a.actorName ?? '',
      AtorRole: a.actorRole ?? '',
      Entidade: a.entity,
      EntidadeID: a.entityId ?? '',
      Acao: a.action,
      IP: a.ip ?? '',
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(userRows), 'Beneficiarios');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(companyRows), 'Empresas');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(providerRows), 'Credenciados');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(transactionRows), 'Atendimentos');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(auditRows), 'Auditoria');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  private formatDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
