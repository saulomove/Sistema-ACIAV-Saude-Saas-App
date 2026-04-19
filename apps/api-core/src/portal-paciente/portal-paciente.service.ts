import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortalPacienteService {
  constructor(private prisma: PrismaService) {}

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
}
