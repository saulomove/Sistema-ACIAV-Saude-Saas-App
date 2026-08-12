import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CATEGORIAS = ['reclamacao', 'sugestao', 'elogio', 'duvida'];
const STATUSES = ['aberta', 'resolvida'];

export interface OuvidoriaActor {
  authUserId: string;
  userId: string | null;
  unitId: string | null;
  role: string;
  name?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class OuvidoriaService {
  constructor(private prisma: PrismaService) {}

  async create(actor: OuvidoriaActor, data: { categoria?: string; assunto?: string; mensagem?: string }) {
    if (!actor.unitId) throw new ForbiddenException('Tenant não identificado.');

    const categoria = (data.categoria || '').trim().toLowerCase();
    const assunto = (data.assunto || '').trim();
    const mensagem = (data.mensagem || '').trim();

    if (!CATEGORIAS.includes(categoria)) throw new BadRequestException('Selecione uma categoria válida.');
    if (assunto.length < 3) throw new BadRequestException('Informe um assunto (mínimo 3 caracteres).');
    if (assunto.length > 120) throw new BadRequestException('Assunto muito longo (máximo 120 caracteres).');
    if (mensagem.length < 10) throw new BadRequestException('Descreva sua manifestação (mínimo 10 caracteres).');
    if (mensagem.length > 2000) throw new BadRequestException('Mensagem muito longa (máximo 2000 caracteres).');

    // Nome/CPF são lidos do cadastro do próprio beneficiário (fonte autoritativa),
    // nunca do client — evita forjar identidade na manifestação.
    let nome = 'Beneficiário';
    let cpf: string | null = null;
    if (actor.userId) {
      const u = await this.prisma.user.findUnique({
        where: { id: actor.userId },
        select: { fullName: true, cpf: true, unitId: true },
      });
      if (u) {
        nome = u.fullName || nome;
        cpf = u.cpf || null;
        // Defesa extra: o unitId da manifestação segue o do usuário, não o do token.
        if (u.unitId) actor.unitId = u.unitId;
      }
    }

    return this.prisma.ouvidoriaMensagem.create({
      data: {
        unitId: actor.unitId,
        userId: actor.userId,
        authUserId: actor.authUserId,
        nome,
        cpf,
        categoria,
        assunto,
        mensagem,
        ip: actor.ip ?? null,
        userAgent: actor.userAgent ?? null,
      },
      select: { id: true, createdAt: true },
    });
  }

  async list(effectiveUnitId: string | undefined, opts: { status?: string; page?: number; limit?: number }) {
    const where: { unitId?: string; status?: string } = {};
    if (effectiveUnitId) where.unitId = effectiveUnitId;
    if (opts.status && STATUSES.includes(opts.status)) where.status = opts.status;

    const openWhere: { unitId?: string; status: string } = { status: 'aberta' };
    if (effectiveUnitId) openWhere.unitId = effectiveUnitId;

    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
    const skip = (page - 1) * limit;

    const [items, total, abertas] = await Promise.all([
      this.prisma.ouvidoriaMensagem.findMany({
        where,
        select: {
          id: true,
          unitId: true,
          nome: true,
          cpf: true,
          categoria: true,
          assunto: true,
          mensagem: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ouvidoriaMensagem.count({ where }),
      this.prisma.ouvidoriaMensagem.count({ where: openWhere }),
    ]);

    return { items, total, abertas, page, limit };
  }

  async updateStatus(actor: OuvidoriaActor, id: string, status: string) {
    const st = (status || '').trim().toLowerCase();
    if (!STATUSES.includes(st)) throw new BadRequestException('Status inválido.');

    const record = await this.prisma.ouvidoriaMensagem.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Manifestação não encontrada.');

    // Multi-tenant: só o super_admin cruza unidades; admin_unit fica preso à sua.
    if (actor.role !== 'super_admin' && record.unitId !== actor.unitId) {
      throw new ForbiddenException('Acesso negado.');
    }

    return this.prisma.ouvidoriaMensagem.update({
      where: { id },
      data: { status: st },
      select: { id: true, status: true, unitId: true, updatedAt: true },
    });
  }
}
