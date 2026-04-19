import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditPayload {
  unitId?: string | null;
  actorAuthUserId?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  entity: string;
  entityId?: string | null;
  action: string;
  diffBefore?: unknown;
  diffAfter?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  log(payload: AuditPayload) {
    this.prisma.auditLog
      .create({
        data: {
          unitId: payload.unitId ?? null,
          actorAuthUserId: payload.actorAuthUserId ?? null,
          actorName: payload.actorName ?? null,
          actorRole: payload.actorRole ?? null,
          entity: payload.entity,
          entityId: payload.entityId ?? null,
          action: payload.action,
          diffBefore: (payload.diffBefore ?? undefined) as Prisma.InputJsonValue | undefined,
          diffAfter: (payload.diffAfter ?? undefined) as Prisma.InputJsonValue | undefined,
          ip: payload.ip ?? null,
          userAgent: payload.userAgent ?? null,
        },
      })
      .catch((err) => this.logger.warn(`AuditLog write failed: ${(err as Error).message}`));
  }

  async findAll(opts: {
    unitId?: string;
    entity?: string;
    action?: string;
    actorAuthUserId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Prisma.AuditLogWhereInput = {};
    if (opts.unitId) where.unitId = opts.unitId;
    if (opts.entity) where.entity = opts.entity;
    if (opts.action) where.action = opts.action;
    if (opts.actorAuthUserId) where.actorAuthUserId = opts.actorAuthUserId;
    if (opts.startDate || opts.endDate) {
      where.createdAt = {};
      if (opts.startDate) where.createdAt.gte = new Date(opts.startDate);
      if (opts.endDate) where.createdAt.lte = new Date(opts.endDate);
    }

    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(200, Math.max(1, opts.limit ?? 50));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async purgeOlderThan(months: number) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const result = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return result;
  }
}
