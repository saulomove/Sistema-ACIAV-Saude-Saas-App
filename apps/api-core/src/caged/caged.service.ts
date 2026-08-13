import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const REF_MONTH_RE = /^20\d{2}-(0[1-9]|1[0-2])$/;

export interface CagedActor {
  authUserId: string;
  unitId: string | null;
  role: string;
  name?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

// Aceita número, string ou vazio; retorna inteiro ou null. Lança em valor não-inteiro.
function parseOptInt(v: unknown, label: string): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'string' ? Number(v.trim()) : (v as number);
  if (typeof n !== 'number' || Number.isNaN(n) || !Number.isInteger(n)) {
    throw new BadRequestException(`${label} inválido (informe um número inteiro).`);
  }
  if (n < -10_000_000 || n > 10_000_000) {
    throw new BadRequestException(`${label} fora do intervalo esperado.`);
  }
  return n;
}

const SELECT = {
  id: true,
  refMonth: true,
  saldo: true,
  admissoes: true,
  desligamentos: true,
  estoque: true,
  source: true,
  updatedAt: true,
} as const;

@Injectable()
export class CagedService {
  constructor(private prisma: PrismaService) {}

  // Histórico do CAGED de UMA unidade (município). super_admin escolhe a unidade;
  // admin_unit é sempre travado na própria (o controller resolve o effectiveUnitId).
  async list(effectiveUnitId: string | undefined) {
    if (!effectiveUnitId) return { unit: null, items: [] };
    const unit = await this.prisma.unit.findUnique({
      where: { id: effectiveUnitId },
      select: { id: true, name: true, cityName: true, state: true, ibgeCode: true },
    });
    if (!unit) return { unit: null, items: [] };
    const items = await this.prisma.cagedStat.findMany({
      where: { unitId: effectiveUnitId },
      orderBy: { refMonth: 'desc' },
      select: SELECT,
    });
    return { unit, items };
  }

  async upsert(
    effectiveUnitId: string | undefined,
    data: { refMonth?: string; saldo?: number | string; admissoes?: number | string; desligamentos?: number | string; estoque?: number | string },
  ) {
    if (!effectiveUnitId) throw new ForbiddenException('Tenant não identificado.');

    const refMonth = (data.refMonth || '').trim();
    if (!REF_MONTH_RE.test(refMonth)) {
      throw new BadRequestException('Competência inválida. Use o formato AAAA-MM (ex: 2026-06).');
    }

    const saldo = parseOptInt(data.saldo, 'Saldo');
    const admissoes = parseOptInt(data.admissoes, 'Admissões');
    const desligamentos = parseOptInt(data.desligamentos, 'Desligamentos');
    const estoque = parseOptInt(data.estoque, 'Estoque');

    if (saldo === null && admissoes === null && desligamentos === null && estoque === null) {
      throw new BadRequestException('Informe pelo menos um indicador (saldo, admissões, desligamentos ou estoque).');
    }

    const unit = await this.prisma.unit.findUnique({ where: { id: effectiveUnitId }, select: { id: true } });
    if (!unit) throw new NotFoundException('Unidade não encontrada.');

    return this.prisma.cagedStat.upsert({
      where: { unitId_refMonth: { unitId: effectiveUnitId, refMonth } },
      create: { unitId: effectiveUnitId, refMonth, saldo, admissoes, desligamentos, estoque, source: 'manual' },
      update: { saldo, admissoes, desligamentos, estoque, source: 'manual' },
      select: SELECT,
    });
  }

  async remove(actor: CagedActor, id: string) {
    // Multi-tenant: admin_unit só enxerga/apaga registro da própria unidade. Filtrar
    // o tenant já no where unifica a resposta em 404 (não revela existência em outro tenant).
    const where = actor.role === 'super_admin' ? { id } : { id, unitId: actor.unitId ?? '' };
    const record = await this.prisma.cagedStat.findFirst({ where });
    if (!record) throw new NotFoundException('Registro não encontrado.');
    await this.prisma.cagedStat.delete({ where: { id: record.id } });
    return { id: record.id, unitId: record.unitId };
  }
}
