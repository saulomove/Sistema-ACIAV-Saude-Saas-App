import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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

    await this.prisma.session.create({
      data: {
        authUserId: authUser.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      token,
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
