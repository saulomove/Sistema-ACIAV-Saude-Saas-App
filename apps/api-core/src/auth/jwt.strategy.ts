import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'aciav-secret-key-change-in-production',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req) ?? '';

    // Valida que a sessão existe no BD e não expirou
    // Isso garante que logout invalida o token imediatamente
    const session = await this.prisma.session.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
    });

    if (!session) {
      throw new UnauthorizedException('Sessão inválida ou expirada. Faça login novamente.');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      unitId: payload.unitId,
      companyId: payload.companyId,
      providerId: payload.providerId,
      userId: payload.userId,
    };
  }
}
