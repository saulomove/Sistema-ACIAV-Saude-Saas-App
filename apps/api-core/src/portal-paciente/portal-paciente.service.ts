import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

interface ActorContext {
  authUserId: string;
  userId: string | null;
  name?: string | null;
  unitId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface NotificationSettings {
  email: boolean;
  whatsapp: boolean;
  newProviders: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  email: true,
  whatsapp: true,
  newProviders: true,
};

function parseSettings(raw: string | null | undefined): { notifications: NotificationSettings } {
  if (!raw) return { notifications: DEFAULT_NOTIFICATIONS };
  try {
    const parsed = JSON.parse(raw);
    const n = parsed?.notifications ?? {};
    return {
      notifications: {
        email: typeof n.email === 'boolean' ? n.email : DEFAULT_NOTIFICATIONS.email,
        whatsapp: typeof n.whatsapp === 'boolean' ? n.whatsapp : DEFAULT_NOTIFICATIONS.whatsapp,
        newProviders: typeof n.newProviders === 'boolean' ? n.newProviders : DEFAULT_NOTIFICATIONS.newProviders,
      },
    };
  } catch {
    return { notifications: DEFAULT_NOTIFICATIONS };
  }
}

@Injectable()
export class PortalPacienteService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getSummary(userId: string) {
    if (!userId) throw new BadRequestException('userId ausente no token.');

    const [agg, count, last] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { userId },
        _sum: { amountSaved: true },
      }),
      this.prisma.transaction.count({ where: { userId } }),
      this.prisma.transaction.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      totalSaved: Number(agg._sum.amountSaved ?? 0),
      totalTransactions: count,
      lastVisit: last?.createdAt ?? null,
    };
  }

  async firstAccess(
    authUserId: string,
    userId: string | null,
    data: { fullName?: string; email: string; whatsapp: string; birthDate?: string; newPassword: string },
  ) {
    if (!userId) throw new ForbiddenException('Sessão sem beneficiário vinculado.');

    const email = (data.email ?? '').trim().toLowerCase();
    const whatsapp = (data.whatsapp ?? '').replace(/\D/g, '');
    const fullName = data.fullName?.trim();
    const newPassword = data.newPassword ?? '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Informe um e-mail válido.');
    }
    if (!whatsapp || whatsapp.length < 10) {
      throw new BadRequestException('Informe um WhatsApp válido com DDD.');
    }
    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      throw new BadRequestException('A nova senha deve ter no mínimo 8 caracteres e conter ao menos um número.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Beneficiário não encontrado.');

    const emailClash = await this.prisma.authUser.findFirst({
      where: { email, id: { not: authUserId } },
      select: { id: true },
    });
    if (emailClash) {
      throw new BadRequestException('Este e-mail já está em uso por outro usuário.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const birthDate = data.birthDate ? new Date(data.birthDate) : undefined;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(fullName ? { fullName } : {}),
          email,
          whatsapp,
          ...(birthDate ? { birthDate } : {}),
          firstAccessDone: true,
        },
      }),
      this.prisma.authUser.update({
        where: { id: authUserId },
        data: {
          email,
          passwordHash,
          passwordChangeRequired: false,
        },
      }),
      this.prisma.session.deleteMany({ where: { authUserId } }),
    ]);

    return { ok: true };
  }

  async getFirstAccessState(authUserId: string, userId: string | null) {
    if (!userId) return { firstAccessDone: true, passwordChangeRequired: false };
    const [user, auth] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, email: true, whatsapp: true, birthDate: true, firstAccessDone: true },
      }),
      this.prisma.authUser.findUnique({
        where: { id: authUserId },
        select: { passwordChangeRequired: true },
      }),
    ]);
    return {
      firstAccessDone: user?.firstAccessDone ?? false,
      passwordChangeRequired: auth?.passwordChangeRequired ?? false,
      prefill: {
        fullName: user?.fullName ?? '',
        email: user?.email ?? '',
        whatsapp: user?.whatsapp ?? '',
        birthDate: user?.birthDate ?? null,
      },
    };
  }

  async getMe(userId: string | null) {
    if (!userId) throw new ForbiddenException('Sessão sem beneficiário vinculado.');
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        cpf: true,
        email: true,
        whatsapp: true,
        phone: true,
        birthDate: true,
        gender: true,
        photoUrl: true,
        settings: true,
        company: { select: { corporateName: true } },
      },
    });
    if (!user) throw new NotFoundException('Beneficiário não encontrado.');
    const { settings: rawSettings, ...rest } = user;
    return {
      ...rest,
      settings: parseSettings(rawSettings),
    };
  }

  async updateMe(
    actor: ActorContext,
    data: { fullName?: string; whatsapp?: string; email?: string; birthDate?: string; phone?: string; gender?: string },
  ) {
    const userId = actor.userId;
    if (!userId) throw new ForbiddenException('Sessão sem beneficiário vinculado.');
    const before = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, whatsapp: true, email: true, phone: true, birthDate: true, gender: true, unitId: true },
    });
    if (!before) throw new NotFoundException('Beneficiário não encontrado.');

    const patch: Record<string, unknown> = {};
    if (data.fullName !== undefined) {
      const v = data.fullName.trim();
      if (v.length < 3) throw new BadRequestException('Nome completo deve ter ao menos 3 caracteres.');
      patch.fullName = v;
    }
    if (data.whatsapp !== undefined) {
      const v = data.whatsapp.replace(/\D/g, '');
      if (v && v.length < 10) throw new BadRequestException('WhatsApp inválido.');
      patch.whatsapp = v || null;
    }
    if (data.phone !== undefined) {
      const v = data.phone.replace(/\D/g, '');
      patch.phone = v || null;
    }
    if (data.email !== undefined) {
      const v = data.email.trim().toLowerCase();
      if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        throw new BadRequestException('E-mail inválido.');
      }
      if (v) {
        const clash = await this.prisma.authUser.findFirst({
          where: { email: v, id: { not: actor.authUserId } },
          select: { id: true },
        });
        if (clash) throw new BadRequestException('Este e-mail já está em uso por outro usuário.');
      }
      patch.email = v || null;
    }
    if (data.birthDate !== undefined) {
      patch.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    }
    if (data.gender !== undefined) {
      const v = data.gender.trim();
      patch.gender = v || null;
    }

    if (Object.keys(patch).length === 0) return { ok: true, unchanged: true };

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: patch,
      select: {
        id: true, fullName: true, cpf: true, email: true, whatsapp: true,
        phone: true, birthDate: true, gender: true, photoUrl: true,
      },
    });

    if (patch.email !== undefined) {
      await this.prisma.authUser.updateMany({
        where: { userId },
        data: { email: (patch.email as string | null) ?? before.email ?? `user-${userId}@noemail.local` },
      }).catch(() => undefined);
    }

    this.audit.log({
      unitId: before.unitId ?? actor.unitId ?? null,
      actorAuthUserId: actor.authUserId,
      actorName: actor.name ?? before.fullName,
      actorRole: 'patient',
      entity: 'User',
      entityId: userId,
      action: 'update',
      diffBefore: before,
      diffAfter: patch,
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return { ok: true, user: updated };
  }

  async updateNotifications(actor: ActorContext, notifications: Partial<NotificationSettings>) {
    const userId = actor.userId;
    if (!userId) throw new ForbiddenException('Sessão sem beneficiário vinculado.');
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true, unitId: true },
    });
    if (!user) throw new NotFoundException('Beneficiário não encontrado.');
    const current = parseSettings(user.settings);
    const next = {
      notifications: {
        email: typeof notifications.email === 'boolean' ? notifications.email : current.notifications.email,
        whatsapp: typeof notifications.whatsapp === 'boolean' ? notifications.whatsapp : current.notifications.whatsapp,
        newProviders: typeof notifications.newProviders === 'boolean' ? notifications.newProviders : current.notifications.newProviders,
      },
    };
    await this.prisma.user.update({
      where: { id: userId },
      data: { settings: JSON.stringify(next) },
    });
    this.audit.log({
      unitId: user.unitId ?? null,
      actorAuthUserId: actor.authUserId,
      actorRole: 'patient',
      entity: 'User',
      entityId: userId,
      action: 'update',
      diffBefore: current,
      diffAfter: next,
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });
    return { ok: true, settings: next };
  }

  async changePassword(
    actor: ActorContext,
    data: { currentPassword: string; newPassword: string },
  ) {
    const current = (data.currentPassword ?? '').trim();
    const next = (data.newPassword ?? '').trim();
    if (!current || !next) throw new BadRequestException('Informe a senha atual e a nova senha.');
    if (next.length < 8 || !/\d/.test(next)) {
      throw new BadRequestException('A nova senha deve ter no mínimo 8 caracteres e conter ao menos um número.');
    }

    const auth = await this.prisma.authUser.findUnique({ where: { id: actor.authUserId } });
    if (!auth) throw new NotFoundException('Usuário não encontrado.');
    const valid = await bcrypt.compare(current, auth.passwordHash);
    if (!valid) throw new BadRequestException('Senha atual incorreta.');
    if (await bcrypt.compare(next, auth.passwordHash)) {
      throw new BadRequestException('A nova senha deve ser diferente da atual.');
    }

    const passwordHash = await bcrypt.hash(next, 10);
    await this.prisma.$transaction([
      this.prisma.authUser.update({
        where: { id: actor.authUserId },
        data: { passwordHash, passwordChangeRequired: false },
      }),
      this.prisma.session.deleteMany({ where: { authUserId: actor.authUserId } }),
    ]);

    this.audit.log({
      unitId: actor.unitId ?? null,
      actorAuthUserId: actor.authUserId,
      actorRole: 'patient',
      entity: 'AuthUser',
      entityId: actor.authUserId,
      action: 'reset_password',
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return { ok: true };
  }

  async exportMyData(userId: string | null): Promise<Buffer> {
    if (!userId) throw new ForbiddenException('Sessão sem beneficiário vinculado.');
    const [user, transactions, clicks] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          company: { select: { corporateName: true, cnpj: true } },
          parent: { select: { fullName: true, cpf: true } },
        },
      }),
      this.prisma.transaction.findMany({
        where: { userId },
        include: {
          provider: { select: { name: true, category: true } },
          service: { select: { description: true, originalPrice: true, discountedPrice: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.providerContactClick.findMany({
        where: { userId },
        include: { provider: { select: { name: true } } },
        orderBy: { clickedAt: 'desc' },
      }),
    ]);
    if (!user) throw new NotFoundException('Beneficiário não encontrado.');

    const fmt = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : '');
    const dadosRow = [{
      Campo: 'Nome Completo', Valor: user.fullName,
    }, { Campo: 'CPF', Valor: user.cpf },
    { Campo: 'Tipo', Valor: user.type },
    { Campo: 'E-mail', Valor: user.email ?? '' },
    { Campo: 'WhatsApp', Valor: user.whatsapp ?? '' },
    { Campo: 'Telefone', Valor: user.phone ?? '' },
    { Campo: 'Data de Nascimento', Valor: fmt(user.birthDate) },
    { Campo: 'Sexo', Valor: user.gender ?? '' },
    { Campo: 'Empresa', Valor: user.company?.corporateName ?? '' },
    { Campo: 'Titular', Valor: user.parent?.fullName ?? '' },
    { Campo: 'Aderiu em', Valor: fmt(user.memberSince) },
    { Campo: 'Status', Valor: user.status ? 'Ativo' : 'Inativo' }];

    const transactionRows = transactions.map((t) => ({
      Data: fmt(t.createdAt),
      Credenciado: t.provider.name,
      Categoria: t.provider.category,
      Servico: t.service.description,
      ValorOriginal: Number(t.service.originalPrice),
      ValorEconomizado: Number(t.amountSaved),
      Confirmado: t.confirmedByUser ? 'Sim' : 'Não',
      Avaliacao: t.rating ?? '',
    }));

    const clickRows = clicks.map((c) => ({
      Data: fmt(c.clickedAt),
      Credenciado: c.provider.name,
      Canal: c.channel,
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(dadosRow), 'Dados Pessoais');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(transactionRows), 'Atendimentos');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(clickRows), 'Interacoes Guia');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async requestDeletion(actor: ActorContext, reason: string) {
    const userId = actor.userId;
    if (!userId) throw new ForbiddenException('Sessão sem beneficiário vinculado.');
    const trimmed = (reason ?? '').trim();
    if (trimmed.length < 5) {
      throw new BadRequestException('Informe o motivo da solicitação (mínimo 5 caracteres).');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { unitId: true, status: true },
    });
    if (!user) throw new NotFoundException('Beneficiário não encontrado.');

    this.audit.log({
      unitId: user.unitId,
      actorAuthUserId: actor.authUserId,
      actorRole: 'patient',
      entity: 'User',
      entityId: userId,
      action: 'delete_request',
      diffAfter: { reason: trimmed },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return { ok: true };
  }
}
