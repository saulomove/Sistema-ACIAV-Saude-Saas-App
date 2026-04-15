import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const authUser = await this.prisma.authUser.findUnique({ where: { email } });

    if (!authUser || !authUser.status) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const passwordMatch = await bcrypt.compare(password, authUser.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

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
    if (data.password.length < 8 || !/\d/.test(data.password)) {
      throw new BadRequestException('A senha deve ter no mínimo 8 caracteres e conter ao menos um número.');
    }
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

  async changePassword(authUserId: string, currentPassword: string, newPassword: string) {
    const authUser = await this.prisma.authUser.findUnique({ where: { id: authUserId } });
    if (!authUser) throw new UnauthorizedException();

    const match = await bcrypt.compare(currentPassword, authUser.passwordHash);
    if (!match) throw new BadRequestException('Senha atual incorreta.');

    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      throw new BadRequestException('A nova senha deve ter no mínimo 8 caracteres e conter ao menos um número.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.authUser.update({ where: { id: authUserId }, data: { passwordHash } });
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
}
