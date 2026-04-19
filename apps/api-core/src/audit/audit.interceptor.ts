import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'newPassword',
  'currentPassword',
  'tokenHash',
  'token',
  'refreshToken',
]);

function redact(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEYS.has(k) ? '[redacted]' : redact(v);
    }
    return out;
  }
  return value;
}

function inferEntity(path: string): { entity: string; entityId?: string } {
  const parts = path.replace(/^\/+/, '').split('/').filter(Boolean);
  if (parts.length === 0) return { entity: 'unknown' };
  const entity = parts[0];
  const entityId = parts[1] && !parts[1].startsWith('?') ? parts[1] : undefined;
  return { entity, entityId };
}

function inferAction(method: string, path: string): string | null {
  const m = method.toUpperCase();
  if (m === 'POST') {
    if (path.includes('/import')) return 'import';
    if (path.includes('/export')) return 'export';
    if (path.includes('/login')) return 'login';
    if (path.includes('/reset-password')) return 'reset_password';
    return 'create';
  }
  if (m === 'PUT' || m === 'PATCH') {
    if (path.includes('/status')) return 'status_change';
    if (path.includes('/inactivate')) return 'status_change';
    if (path.includes('/reactivate')) return 'status_change';
    return 'update';
  }
  if (m === 'DELETE') return 'delete';
  return null; // skip GETs
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = ctx.switchToHttp();
    const req = http.getRequest<{
      method: string;
      originalUrl?: string;
      url?: string;
      body?: unknown;
      headers?: Record<string, unknown>;
      ip?: string;
      user?: {
        sub?: string;
        email?: string;
        role?: string;
        unitId?: string;
      };
    }>();

    const method = req.method;
    const path = req.originalUrl ?? req.url ?? '';
    const action = inferAction(method, path);

    if (!action) return next.handle();

    const { entity, entityId } = inferEntity(path);
    const user = req.user;
    const bodySnapshot = redact(req.body);

    return next.handle().pipe(
      tap((response) => {
        const responseId =
          typeof response === 'object' && response !== null && 'id' in (response as Record<string, unknown>)
            ? String((response as Record<string, unknown>).id)
            : undefined;

        this.audit.log({
          unitId: user?.unitId ?? null,
          actorAuthUserId: user?.sub ?? null,
          actorName: user?.email ?? null,
          actorRole: user?.role ?? null,
          entity,
          entityId: entityId ?? responseId ?? null,
          action,
          diffAfter: bodySnapshot,
          ip: (req.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? null,
          userAgent: (req.headers?.['user-agent'] as string | undefined) ?? null,
        });
      }),
    );
  }
}
