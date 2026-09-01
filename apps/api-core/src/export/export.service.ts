import { ForbiddenException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Colunas EXATAS exigidas pelo sistema financeiro (ordem e nomes do modelo, com cabeçalhos repetidos).
// Layout v2 (2026-09-01, devolvido pelo financeiro): codCidade/CODCIDADE viraram CEP/CIDADE/UF
// (nome da cidade por extenso, ex.: "VIDEIRA"/"SC") e ganhou a coluna final VALOR_PLANO. 25 colunas.
const FINANCEIRO_HEADER = [
  'CODIGO_EMPRESA', 'EMPRESA', 'CPF/CNPJ', 'ENDERECO', 'BAIRRO', 'CEP', 'CIDADE', 'UF',
  'CODIGO_ASSOCIADO', 'ASSOCIADO', 'CPF_TITULAR', 'ENDENRECO_ASSOCIADO', 'BAIRRO', 'CEP', 'CIDADE', 'UF',
  'TIPO', 'ESTADO_CIVIL', 'CODIGO_DEPENDENTE', 'SEXO', 'CPF_DEPENDENTE', 'DEPENDETE', 'CPF_TITULAR', 'PARENTESCO', 'VALOR_PLANO',
];

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

  // ===== Exportação Financeiro (Cobrança) — formato exato do sistema financeiro =====

  private normCity(s?: string | null): string {
    return (s ?? '').toUpperCase().trim();
  }

  /** Só dígitos, como NÚMERO (igual ao modelo: zeros à esquerda caem). Vazio -> ''. */
  private numVal(s?: string | null): number | string {
    const d = (s ?? '').toString().replace(/\D/g, '');
    return d ? Number(d) : '';
  }

  /** Só dígitos, como TEXTO (preserva zeros à esquerda — CEP de SP começa com 0). */
  private digits(s?: string | null): string {
    return (s ?? '').toString().replace(/\D/g, '');
  }

  /** Código externo: número se for só dígitos, senão o texto original. */
  private codeVal(s?: string | null): number | string {
    const d = (s ?? '').toString().trim();
    return /^\d+$/.test(d) ? Number(d) : d;
  }

  private async getSavedCityCodes(unitId: string): Promise<Record<string, number>> {
    const rows = await this.prisma.cityCode.findMany({
      where: { unitId },
      select: { cityName: true, code: true },
    });
    const out: Record<string, number> = {};
    for (const r of rows) out[this.normCity(r.cityName)] = r.code;
    return out;
  }

  /** Lista as cidades das empresas da unidade + o código de-para salvo (para a tela de edição). */
  async getCityCodes(unitId: string): Promise<{ cities: { name: string; count: number; code: number | null }[] }> {
    const saved = await this.getSavedCityCodes(unitId);
    const companies = await this.prisma.company.findMany({
      where: { unitId, externalCode: { not: null } },
      select: { city: true },
    });
    const counts = new Map<string, number>();
    for (const c of companies) {
      const name = this.normCity(c.city);
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    const cities = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count, code: saved[name] ?? null }));
    return { cities };
  }

  /** Substitui, de forma atômica, o de-para cidade->código da unidade (tabela própria CityCode). */
  async saveCityCodes(unitId: string, codes: Record<string, unknown>): Promise<void> {
    const rows: { unitId: string; cityName: string; code: number }[] = [];
    for (const [k, v] of Object.entries(codes ?? {})) {
      const cityName = this.normCity(k);
      if (!cityName) continue;
      const n = Number(v);
      if (Number.isFinite(n) && n !== 0) rows.push({ unitId, cityName, code: Math.trunc(n) });
    }
    await this.prisma.$transaction([
      this.prisma.cityCode.deleteMany({ where: { unitId } }),
      ...(rows.length ? [this.prisma.cityCode.createMany({ data: rows })] : []),
    ]);
  }

  /**
   * Gera o arquivo de cobrança no formato exato do modelo financeiro.
   * Denormalizado: por empresa -> por titular -> 1 linha do titular (TIPO=T) + 1 por dependente (TIPO=D).
   * Exclui empresas/beneficiários SEM código externo (testes) — o financeiro casa por esse código.
   */
  async exportFinanceiro(opts: {
    unitId?: string;
    status?: string;
    companyId?: string;
  }): Promise<{ buffer: Buffer; rowCount: number; excludedCount: number }> {
    const unitId = opts.unitId;
    if (!unitId) throw new ForbiddenException('Selecione uma unidade.');

    const status = opts.status ?? 'active';
    // O filtro de situação vale para o BENEFICIÁRIO (titular/dependente), não para a empresa —
    // assim "ativos" = todos os beneficiários ativos, independentemente do status da empresa.
    const companyWhere: Prisma.CompanyWhereInput = { unitId, externalCode: { not: null } };
    if (opts.companyId) companyWhere.id = opts.companyId;

    const companies = await this.prisma.company.findMany({
      where: companyWhere,
      include: { users: { where: { unitId } } },
      orderBy: { corporateName: 'asc' },
    });

    const matchesStatus = (u: { status: boolean }) =>
      status === 'all' ? true : status === 'inactive' ? !u.status : u.status;

    const rows: (string | number)[][] = [FINANCEIRO_HEADER];
    let rowCount = 0;
    let excludedCount = 0;

    for (const c of companies) {
      if (!c.externalCode) continue; // exclui empresas de teste (sem código externo, ex.: ACIAV/Karikal)
      const emp = [
        this.codeVal(c.externalCode), c.corporateName ?? '', this.numVal(c.cnpj),
        c.address ?? '', c.neighborhood ?? '', this.digits(c.zipCode), (c.city ?? '').trim(), (c.state ?? '').trim(),
      ];

      const titulares = c.users.filter((u) => u.type === 'titular' && matchesStatus(u));
      for (const t of titulares) {
        if (!t.externalCode) { excludedCount++; continue; }
        // Endereço do associado = do TITULAR (com fallback para o endereço da empresa).
        const tAddr = [t.address, t.addressNumber].filter((x) => (x ?? '').trim()).join(' ').trim() || (c.address ?? '');
        const tBairro = (t.neighborhood ?? '').trim() || (c.neighborhood ?? '');
        const tZip = this.digits(t.zipCode) || this.digits(c.zipCode);
        const tCity = (t.city ?? '').trim() || (c.city ?? '').trim();
        const tUf = (t.state ?? '').trim() || (c.state ?? '').trim();
        const assoc = [this.codeVal(t.externalCode), t.fullName ?? '', this.numVal(t.cpf), tAddr, tBairro, tZip, tCity, tUf];
        // VALOR_PLANO (última coluna) fica vazio até a ACIAV definir os valores dos planos.
        rows.push([...emp, ...assoc, 'T', 'OU', this.codeVal(t.externalCode), t.gender || 'N', this.numVal(t.cpf), t.fullName ?? '', this.numVal(t.cpf), '', '']);
        rowCount++;
        const deps = c.users.filter((u) => u.type === 'dependente' && u.parentId === t.id && matchesStatus(u));
        for (const d of deps) {
          if (!d.externalCode) { excludedCount++; continue; }
          rows.push([...emp, ...assoc, 'D', 'OU', this.codeVal(d.externalCode), d.gender || 'N', this.numVal(d.cpf), d.fullName ?? '', this.numVal(t.cpf), d.kinship ?? '', '']);
          rowCount++;
        }
      }
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Planilha1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    return { buffer, rowCount, excludedCount };
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
