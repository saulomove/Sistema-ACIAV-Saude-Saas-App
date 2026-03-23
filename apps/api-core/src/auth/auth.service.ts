import { Injectable, UnauthorizedException } from '@nestjs/common';
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
