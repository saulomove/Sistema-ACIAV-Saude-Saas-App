import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const ALLOWED_EVENTS = new Set([
  'user.created',
  'user.updated',
  'user.inactivated',
  'transaction.created',
  'company.created',
  'provider.created',
  'auth.login',
  'test.ping',
]);

interface ActorContext {
  authUserId?: string | null;
  name?: string | null;
  role?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

function sanitizeEvents(raw: string): string {
  const list = raw
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.length > 0 && ALLOWED_EVENTS.has(e));
  if (list.length === 0) throw new BadRequestException('Ao menos um evento válido é obrigatório.');
  return Array.from(new Set(list)).join(',');
}

function validateUrl(raw: string): string {
  try {
    const u = new URL(raw);
    if (!/^https?:$/.test(u.protocol)) throw new Error('invalid');
    return u.toString();
  } catch {
    throw new BadRequestException('URL inválida.');
  }
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger('WebhooksService');

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async list(unitId: string) {
    return this.prisma.webhook.findMany({
      where: { unitId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, url: true, events: true, status: true, createdAt: true, updatedAt: true },
    });
  }

  async create(unitId: string, data: { url: string; events: string }, actor: ActorContext) {
    const url = validateUrl(data.url);
    const events = sanitizeEvents(data.events);
    const secret = crypto.randomBytes(24).toString('hex');

    const row = await this.prisma.webhook.create({
      data: { unitId, url, events, secret },
    });

    this.audit.log({
      unitId,
      actorAuthUserId: actor.authUserId ?? undefined,
      actorName: actor.name ?? undefined,
      actorRole: actor.role ?? undefined,
      entity: 'webhook',
      entityId: row.id,
      action: 'create',
      diffAfter: { url, events },
      ip: actor.ip ?? undefined,
      userAgent: actor.userAgent ?? undefined,
    });

    return { id: row.id, url: row.url, events: row.events, status: row.status, createdAt: row.createdAt, secret };
  }

  async remove(unitId: string, id: string, actor: ActorContext) {
    const hook = await this.prisma.webhook.findUnique({ where: { id } });
    if (!hook) throw new NotFoundException('Webhook não encontrado.');
    if (hook.unitId !== unitId) throw new NotFoundException('Webhook não encontrado.');

    await this.prisma.webhook.delete({ where: { id } });

    this.audit.log({
      unitId,
      actorAuthUserId: actor.authUserId ?? undefined,
      actorName: actor.name ?? undefined,
      actorRole: actor.role ?? undefined,
      entity: 'webhook',
      entityId: id,
      action: 'delete',
      diffBefore: { url: hook.url, events: hook.events },
      ip: actor.ip ?? undefined,
      userAgent: actor.userAgent ?? undefined,
    });

    return { ok: true };
  }

  async sendTest(unitId: string, id: string) {
    const hook = await this.prisma.webhook.findUnique({ where: { id } });
    if (!hook) throw new NotFoundException('Webhook não encontrado.');
    if (hook.unitId !== unitId) throw new NotFoundException('Webhook não encontrado.');

    const payload = { event: 'test.ping', sentAt: new Date().toISOString(), unitId, message: 'Teste de webhook ACIAV Saúde.' };
    const result = await this.deliver(hook.id, hook.url, hook.secret, 'test.ping', payload);
    return { ok: result.success, status: result.status };
  }

  async dispatch(unitId: string, event: string, payload: Record<string, unknown>) {
    if (!ALLOWED_EVENTS.has(event)) return;

    const hooks = await this.prisma.webhook.findMany({
      where: { unitId, status: true },
      select: { id: true, url: true, events: true, secret: true },
    }).catch(() => []);

    for (const hook of hooks) {
      if (!hook.events.split(',').map((e) => e.trim()).includes(event)) continue;
      this.deliver(hook.id, hook.url, hook.secret, event, { event, sentAt: new Date().toISOString(), unitId, payload }).catch(() => undefined);
    }
  }

  private async deliver(webhookId: string, url: string, secret: string, event: string, payload: Record<string, unknown>) {
    const body = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let status: number | null = null;
    let responseBody: string | null = null;
    let success = false;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Aciav-Event': event,
          'X-Aciav-Signature': signature,
        },
        body,
        signal: controller.signal,
      });
      status = res.status;
      responseBody = (await res.text().catch(() => '')).slice(0, 1000);
      success = res.ok;
    } catch (err) {
      responseBody = (err as Error).message.slice(0, 500);
    } finally {
      clearTimeout(timeout);
    }

    await this.prisma.webhookDelivery.create({
      data: {
        webhookId,
        event,
        payload: payload as any,
        responseCode: status ?? undefined,
        responseBody: responseBody ?? undefined,
        success,
      },
    }).catch(() => undefined);

    return { success, status };
  }
}
