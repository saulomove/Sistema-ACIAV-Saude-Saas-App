import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';

interface ActorContext {
  authUserId: string;
  role: string;
  unitId?: string | null;
  name?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

const VALID_ROLES_FOR_INVITE = ['admin_unit'];
const ADMIN_ROLES = ['super_admin', 'admin_unit'];

function generateTempPassword(): string {
  return crypto.randomBytes(6).toString('base64url').slice(0, 10) + 'A1';
}

function renderWelcomeEmail(params: { name: string; email: string; tempPassword: string; loginUrl: string }): { html: string; text: string } {
  const safeName = (params.name || 'Administrador').replace(/</g, '&lt;');
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Bem-vindo — ACIAV Saúde</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8f9fa;padding:32px;color:#0f172a;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
    <h1 style="color:#007178;margin:0 0 16px;font-size:22px;">Bem-vindo à ACIAV Saúde</h1>
    <p>Olá, <strong>${safeName}</strong>.</p>
    <p>Sua conta de administrador foi criada. Use os dados abaixo para acessar pela primeira vez:</p>
    <p><strong>E-mail:</strong> ${params.email}<br><strong>Senha temporária:</strong> <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">${params.tempPassword}</code></p>
    <p style="text-align:center;margin:32px 0;">
      <a href="${params.loginUrl}" style="background:#007178;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:bold;display:inline-block;">Acessar o sistema</a>
    </p>
    <p style="font-size:13px;color:#64748b;">Ao entrar, você será solicitado a trocar a senha.</p>
  </div>
</body></html>`;
  const text = `Olá, ${safeName}.\n\nSua conta de administrador foi criada na ACIAV Saúde.\n\nE-mail: ${params.email}\nSenha temporária: ${params.tempPassword}\n\nAcesse: ${params.loginUrl}`;
  return { html, text };
}

@Injectable()
export class AuthUsersService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private audit: AuditService,
  ) {}

  async list(filters: { unitId?: string; roles?: string[] }) {
    const where: any = {};
    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.roles && filters.roles.length > 0) {
      where.role = { in: filters.roles };
    }
    const rows = await this.prisma.authUser.findMany({
      where,
      select: {
        id: true, email: true, role: true, status: true, displayName: true, lastLoginAt: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({ ...r, name: r.displayName }));
  }

  async counts(unitId: string) {
    if (!unitId) return { admin_unit: 0, rh: 0, provider: 0, patient: 0, super_admin: 0 };
    const rows = await this.prisma.authUser.groupBy({
      by: ['role'],
      where: { unitId, status: true },
      _count: { _all: true },
    });
    const result: Record<string, number> = { admin_unit: 0, rh: 0, provider: 0, patient: 0, super_admin: 0 };
    for (const r of rows) {
      result[r.role] = r._count._all;
    }
    return result;
  }

  async invite(data: { email: string; name: string; role: string; unitId: string }, actor: ActorContext) {
    if (!ADMIN_ROLES.includes(actor.role)) {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }
    if (actor.role === 'admin_unit' && actor.unitId && data.unitId !== actor.unitId) {
      throw new ForbiddenException('Fora da sua unidade.');
    }
    if (!VALID_ROLES_FOR_INVITE.includes(data.role)) {
      throw new BadRequestException('Papel inválido para convite pelo painel.');
    }
    if (!data.email?.includes('@')) {
      throw new BadRequestException('E-mail inválido.');
    }
    if (!data.name?.trim()) {
      throw new BadRequestException('Nome obrigatório.');
    }
    const email = data.email.trim().toLowerCase();
    const existing = await this.prisma.authUser.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('E-mail já cadastrado no sistema.');
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const created = await this.prisma.authUser.create({
      data: {
        email,
        passwordHash,
        role: data.role,
        unitId: data.unitId,
        displayName: data.name.trim(),
        passwordChangeRequired: true,
      },
      select: { id: true, email: true, role: true, unitId: true, status: true, displayName: true, createdAt: true },
    });

    const baseUrl = process.env.PUBLIC_APP_URL ?? 'https://aciavsaude.com.br';
    const { html, text } = renderWelcomeEmail({
      name: data.name,
      email: created.email,
      tempPassword,
      loginUrl: `${baseUrl.replace(/\/$/, '')}/login`,
    });
    this.email.send({ to: created.email, subject: 'Bem-vindo à ACIAV Saúde', html, text }).catch(() => undefined);

    this.audit.log({
      unitId: actor.unitId ?? data.unitId,
      actorAuthUserId: actor.authUserId,
      actorName: actor.name,
      actorRole: actor.role,
      entity: 'auth_user',
      entityId: created.id,
      action: 'invite',
      diffAfter: { email: created.email, role: created.role, unitId: created.unitId },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return { ...created, tempPassword };
  }

  async update(id: string, patch: { role?: string; status?: boolean }, actor: ActorContext) {
    if (!ADMIN_ROLES.includes(actor.role)) {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }
    const target = await this.prisma.authUser.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Usuário não encontrado.');

    if (actor.role === 'admin_unit' && actor.unitId && target.unitId !== actor.unitId) {
      throw new ForbiddenException('Fora da sua unidade.');
    }
    if (actor.role !== 'super_admin' && target.role === 'super_admin') {
      throw new ForbiddenException('Não é possível alterar um super admin.');
    }
    if (target.id === actor.authUserId) {
      throw new BadRequestException('Você não pode alterar seu próprio papel ou status.');
    }

    const data: any = {};
    if (patch.role !== undefined) {
      if (!ADMIN_ROLES.includes(patch.role)) {
        throw new BadRequestException('Papel inválido.');
      }
      if (actor.role !== 'super_admin' && patch.role === 'super_admin') {
        throw new ForbiddenException('Apenas super admin pode promover a super admin.');
      }
      data.role = patch.role;
    }
    if (patch.status !== undefined) {
      if (patch.status === false && target.role === 'admin_unit' && target.unitId) {
        const count = await this.prisma.authUser.count({
          where: { unitId: target.unitId, role: 'admin_unit', status: true, id: { not: target.id } },
        });
        if (count === 0) {
          throw new ConflictException('Não é possível inativar o último admin da unidade.');
        }
      }
      data.status = patch.status;
      if (patch.status === false) {
        await this.prisma.session.deleteMany({ where: { authUserId: target.id } });
      }
    }

    if (Object.keys(data).length === 0) return { ...target };

    const updated = await this.prisma.authUser.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, status: true, displayName: true, unitId: true },
    });

    this.audit.log({
      unitId: actor.unitId ?? target.unitId,
      actorAuthUserId: actor.authUserId,
      actorName: actor.name,
      actorRole: actor.role,
      entity: 'auth_user',
      entityId: target.id,
      action: 'update',
      diffBefore: { role: target.role, status: target.status },
      diffAfter: data,
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return updated;
  }

  async resetPassword(id: string, actor: ActorContext) {
    if (!ADMIN_ROLES.includes(actor.role)) {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }
    const target = await this.prisma.authUser.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Usuário não encontrado.');
    if (actor.role === 'admin_unit' && actor.unitId && target.unitId !== actor.unitId) {
      throw new ForbiddenException('Fora da sua unidade.');
    }
    if (actor.role !== 'super_admin' && target.role === 'super_admin') {
      throw new ForbiddenException('Não é possível resetar senha de um super admin.');
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    await this.prisma.authUser.update({
      where: { id },
      data: { passwordHash, passwordChangeRequired: true },
    });
    await this.prisma.session.deleteMany({ where: { authUserId: id } });

    const baseUrl = process.env.PUBLIC_APP_URL ?? 'https://aciavsaude.com.br';
    const { html, text } = renderWelcomeEmail({
      name: target.displayName ?? 'Usuário',
      email: target.email,
      tempPassword,
      loginUrl: `${baseUrl.replace(/\/$/, '')}/login`,
    });
    this.email.send({ to: target.email, subject: 'Sua senha foi redefinida — ACIAV Saúde', html, text }).catch(() => undefined);

    this.audit.log({
      unitId: actor.unitId ?? target.unitId,
      actorAuthUserId: actor.authUserId,
      actorName: actor.name,
      actorRole: actor.role,
      entity: 'auth_user',
      entityId: target.id,
      action: 'reset_password',
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return { tempPassword, email: target.email };
  }
}
