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
