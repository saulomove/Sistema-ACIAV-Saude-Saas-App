import { Injectable, UnauthorizedException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const RESET_TOKEN_TTL_MIN = 15;

interface SecurityPolicy {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSymbol: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutMinutes: number;
  passwordResetExpirationMinutes: number;
}

const DEFAULT_POLICY: SecurityPolicy = {
  passwordMinLength: 8,
  passwordRequireUppercase: false,
  passwordRequireNumber: true,
  passwordRequireSymbol: false,
  sessionTimeoutMinutes: 480,
  maxLoginAttempts: 5,
  lockoutMinutes: 15,
  passwordResetExpirationMinutes: 15,
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private async getPolicy(unitId?: string | null): Promise<SecurityPolicy> {
    if (!unitId) return DEFAULT_POLICY;
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId }, select: { settings: true } });
    try {
      const parsed = unit?.settings ? JSON.parse(unit.settings) : {};
      return { ...DEFAULT_POLICY, ...(parsed.security ?? {}) };
    } catch {
      return DEFAULT_POLICY;
    }
  }

  private validatePasswordPolicy(password: string, policy: SecurityPolicy) {
    if (password.length < policy.passwordMinLength) {
      throw new BadRequestException(`A senha deve ter no mínimo ${policy.passwordMinLength} caracteres.`);
    }
    if (policy.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      throw new BadRequestException('A senha deve conter ao menos uma letra maiúscula.');
    }
    if (policy.passwordRequireNumber && !/\d/.test(password)) {
      throw new BadRequestException('A senha deve conter ao menos um número.');
    }
    if (policy.passwordRequireSymbol && !/[!@#$%^&*(),.?":{}|<>_\-+=~`\[\]\\\/';]/.test(password)) {
      throw new BadRequestException('A senha deve conter ao menos um caractere especial.');
    }
  }

  async login(email: string, password: string) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const authUser = await this.prisma.authUser.findUnique({ where: { email: normalizedEmail } });

    if (!authUser || !authUser.status) {
      this.prisma.loginAttempt.create({ data: { email: normalizedEmail, success: false } }).catch(() => undefined);
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const policy = await this.getPolicy(authUser.unitId);

    if (policy.maxLoginAttempts > 0) {
      const since = new Date(Date.now() - policy.lockoutMinutes * 60 * 1000);
      const recentFailures = await this.prisma.loginAttempt.count({
        where: {
          authUserId: authUser.id,
          success: false,
          createdAt: { gte: since },
        },
      });
      if (recentFailures >= policy.maxLoginAttempts) {
        throw new HttpException('Conta bloqueada temporariamente por excesso de tentativas. Tente novamente mais tarde.', HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    const passwordMatch = await bcrypt.compare(password, authUser.passwordHash);
    if (!passwordMatch) {
      this.prisma.loginAttempt.create({ data: { authUserId: authUser.id, email: normalizedEmail, success: false } }).catch(() => undefined);
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    this.prisma.loginAttempt.create({ data: { authUserId: authUser.id, email: normalizedEmail, success: true } }).catch(() => undefined);

    const payload = {
      sub: authUser.id,
      email: authUser.email,
      role: authUser.role,
      unitId: authUser.unitId,
      companyId: authUser.companyId,
      providerId: authUser.providerId,
      userId: authUser.userId,
    };

    const token = this.jwtService.sign(payload);
    const refreshToken = crypto.randomBytes(40).toString('hex');

    await this.prisma.session.create({
      data: {
        authUserId: authUser.id,
        token,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.authUser.update({
      where: { id: authUser.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => undefined);

    return {
      token,
      refreshToken,
      user: {
        id: authUser.id,
        email: authUser.email,
        role: authUser.role,
        unitId: authUser.unitId,
        companyId: authUser.companyId,
        providerId: authUser.providerId,
        userId: authUser.userId,
      },
    };
  }

  async logout(token: string) {
    await this.prisma.session.deleteMany({ where: { token } });
    return { message: 'Logout realizado com sucesso.' };
  }

  async refresh(refreshToken: string) {
    const session = await this.prisma.session.findFirst({
      where: { refreshToken, expiresAt: { gt: new Date() } },
      include: { authUser: true },
    });

    if (!session || !session.authUser.status) {
      throw new UnauthorizedException('Refresh token inválido ou expirado. Faça login novamente.');
    }

    const payload = {
      sub: session.authUser.id,
      email: session.authUser.email,
      role: session.authUser.role,
      unitId: session.authUser.unitId,
      companyId: session.authUser.companyId,
      providerId: session.authUser.providerId,
      userId: session.authUser.userId,
    };

    const newToken = this.jwtService.sign(payload);
    const newRefreshToken = crypto.randomBytes(40).toString('hex');

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { token: newToken, refreshToken: newRefreshToken };
  }

  async listAdminUsers(filters: { role?: string; unitId?: string }) {
    return this.prisma.authUser.findMany({
      where: {
        ...(filters.role && { role: filters.role }),
        ...(filters.unitId && { unitId: filters.unitId }),
        role: { not: 'patient' },
      },
      select: { id: true, email: true, role: true, unitId: true, companyId: true, providerId: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAdminUser(data: {
    email: string;
    password: string;
    role: string;
    unitId?: string;
    companyId?: string;
    providerId?: string;
  }) {
    const policy = await this.getPolicy(data.unitId);
    this.validatePasswordPolicy(data.password, policy);
    const existing = await this.prisma.authUser.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('E-mail já cadastrado no sistema.');

    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.authUser.create({
      data: { email: data.email, passwordHash, role: data.role, unitId: data.unitId, companyId: data.companyId, providerId: data.providerId },
      select: { id: true, email: true, role: true, unitId: true, status: true, createdAt: true },
    });
  }

  async toggleAdminUserStatus(id: string, status: boolean) {
    return this.prisma.authUser.update({
      where: { id },
      data: { status },
      select: { id: true, email: true, role: true, status: true },
    });
  }

  async updateAdminUser(id: string, data: { email?: string; role?: string; unitId?: string | null }) {
    const current = await this.prisma.authUser.findUnique({ where: { id } });
    if (!current) throw new BadRequestException('Usuário não encontrado.');

    const patch: { email?: string; role?: string; unitId?: string | null } = {};

    if (data.email !== undefined) {
      const email = data.email.trim().toLowerCase();
      if (!email.includes('@')) throw new BadRequestException('E-mail inválido.');
      if (email !== current.email) {
        const dup = await this.prisma.authUser.findUnique({ where: { email } });
        if (dup) throw new BadRequestException('E-mail já utilizado por outro usuário.');
        patch.email = email;
      }
    }

    if (data.role !== undefined) {
      if (!['super_admin', 'admin_unit'].includes(data.role)) {
        throw new BadRequestException('Perfil inválido.');
      }
      patch.role = data.role;
    }

    if (data.unitId !== undefined) {
      patch.unitId = data.unitId || null;
    }

    // super_admin não pode ter unitId
    if ((patch.role ?? current.role) === 'super_admin') {
      patch.unitId = null;
    } else if ((patch.role ?? current.role) === 'admin_unit' && !(patch.unitId ?? current.unitId)) {
      throw new BadRequestException('Admin Unidade requer uma unidade associada.');
    }

    return this.prisma.authUser.update({
      where: { id },
      data: patch,
      select: { id: true, email: true, role: true, unitId: true, status: true },
    });
  }

  async changePassword(authUserId: string, currentPassword: string, newPassword: string) {
    const authUser = await this.prisma.authUser.findUnique({ where: { id: authUserId } });
    if (!authUser) throw new UnauthorizedException();

    const match = await bcrypt.compare(currentPassword, authUser.passwordHash);
    if (!match) throw new BadRequestException('Senha atual incorreta.');

    const policy = await this.getPolicy(authUser.unitId);
    this.validatePasswordPolicy(newPassword, policy);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.authUser.update({ where: { id: authUserId }, data: { passwordHash, passwordChangeRequired: false } });
    return { message: 'Senha alterada com sucesso.' };
  }

  async resetPassword(authUserId: string) {
    const authUser = await this.prisma.authUser.findUnique({ where: { id: authUserId } });
    if (!authUser) throw new BadRequestException('Usuário não encontrado.');

    const tempPassword = crypto.randomBytes(6).toString('base64url').slice(0, 10) + 'A1';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await this.prisma.authUser.update({ where: { id: authUserId }, data: { passwordHash } });

    // Invalida todas as sessões do usuário para forçar novo login
    await this.prisma.session.deleteMany({ where: { authUserId } });

    return { tempPassword, email: authUser.email };
  }

  async resetPasswordByProvider(providerId: string) {
    const authUser = await this.prisma.authUser.findFirst({ where: { providerId } });
    if (!authUser) throw new BadRequestException('Credenciado não possui login cadastrado.');
    return this.resetPassword(authUser.id);
  }

  async resetPasswordByCompany(companyId: string) {
    const authUser = await this.prisma.authUser.findFirst({ where: { companyId } });
    if (!authUser) throw new BadRequestException('Empresa não possui login cadastrado.');
    return this.resetPassword(authUser.id);
  }

  async resetPasswordByUser(userId: string) {
    const authUser = await this.prisma.authUser.findFirst({ where: { userId } });
    if (!authUser) throw new BadRequestException('Beneficiário não possui login cadastrado.');
    return this.resetPassword(authUser.id);
  }

  async me(authUserId: string) {
    const authUser = await this.prisma.authUser.findUnique({
      where: { id: authUserId },
    });

    if (!authUser) throw new UnauthorizedException();

    return {
      id: authUser.id,
      email: authUser.email,
      role: authUser.role,
      unitId: authUser.unitId,
      companyId: authUser.companyId,
      providerId: authUser.providerId,
      userId: authUser.userId,
    };
  }

  async forgotPassword(rawIdentifier: string, origin: string | null) {
    const identifier = (rawIdentifier ?? '').trim().toLowerCase();
    const genericOk = { message: 'Se existir uma conta com esses dados, enviaremos um link para redefinir a senha.' };

    if (!identifier) return genericOk;

    const isEmail = identifier.includes('@');
    let authUser = null as Awaited<ReturnType<typeof this.prisma.authUser.findFirst>> | null;

    if (isEmail) {
      authUser = await this.prisma.authUser.findUnique({ where: { email: identifier } });
      if (!authUser) {
        const user = await this.prisma.user.findFirst({ where: { email: identifier }, select: { id: true } });
        if (user) authUser = await this.prisma.authUser.findFirst({ where: { userId: user.id } });
      }
    } else {
      const cpf = identifier.replace(/\D/g, '');
      if (cpf) {
        authUser = await this.prisma.authUser.findUnique({ where: { email: cpf } });
        if (!authUser) {
          const user = await this.prisma.user.findFirst({ where: { cpf }, select: { id: true } });
          if (user) authUser = await this.prisma.authUser.findFirst({ where: { userId: user.id } });
        }
      }
    }

    if (!authUser || !authUser.status) return genericOk;

    const linkedUser = authUser.userId
      ? await this.prisma.user.findUnique({
          where: { id: authUser.userId },
          select: { email: true, fullName: true },
        })
      : null;

    const deliveryEmail = linkedUser?.email?.trim() || (authUser.email.includes('@') ? authUser.email : '');
    if (!deliveryEmail) {
      return {
        ...genericOk,
        needsEmail: true,
      };
    }

    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MIN * 60 * 1000);

    await this.prisma.passwordResetToken.deleteMany({
      where: { authUserId: authUser.id, usedAt: null, expiresAt: { gt: new Date() } },
    });

    await this.prisma.passwordResetToken.create({
      data: { authUserId: authUser.id, tokenHash, expiresAt },
    });

    const baseUrl = (origin && origin.startsWith('http')) ? origin : (process.env.PUBLIC_APP_URL ?? 'https://aciavsaude.com.br');
    const resetUrl = `${baseUrl.replace(/\/$/, '')}/redefinir-senha?token=${rawToken}`;

    const { html, text } = this.emailService.renderPasswordResetEmail({
      name: linkedUser?.fullName ?? 'beneficiário',
      resetUrl,
      expiresInMinutes: RESET_TOKEN_TTL_MIN,
    });

    await this.emailService.send({
      to: deliveryEmail,
      subject: 'Redefinir sua senha — ACIAV Saúde',
      html,
      text,
    });

    return genericOk;
  }

  async resetPasswordWithToken(rawToken: string, newPassword: string) {
    if (!rawToken) throw new BadRequestException('Token inválido.');

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { authUser: { select: { unitId: true } } },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido ou expirado. Solicite um novo link.');
    }

    const policy = await this.getPolicy(record.authUser.unitId);
    this.validatePasswordPolicy(newPassword, policy);

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.authUser.update({
        where: { id: record.authUserId },
        data: { passwordHash, passwordChangeRequired: false },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.session.deleteMany({ where: { authUserId: record.authUserId } }),
    ]);

    return { ok: true };
  }

  async validateResetToken(rawToken: string) {
    if (!rawToken) return { valid: false as const };
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) return { valid: false as const };
    return { valid: true as const, expiresAt: record.expiresAt };
  }
}
