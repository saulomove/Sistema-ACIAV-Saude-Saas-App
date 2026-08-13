import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { CagedService } from './caged.service';
import { AuditService } from '../audit/audit.service';

@Controller('caged')
@UseGuards(AuthGuard('jwt'))
export class CagedController {
  constructor(
    private readonly service: CagedService,
    private readonly audit: AuditService,
  ) {}

  private actor(req: any) {
    return {
      authUserId: req.user.sub,
      unitId: req.user.unitId ?? null,
      role: req.user.role,
      name: req.user.email ?? null,
      ip: (req.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0] ?? req.ip ?? null,
      userAgent: (req.headers?.['user-agent'] as string | undefined) ?? null,
    };
  }

  private ensureAdmin(req: any) {
    if (!['super_admin', 'admin_unit'].includes(req.user?.role)) {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }
  }

  // super_admin pode passar unitId; admin_unit é sempre travado na própria unidade.
  private effectiveUnitId(req: any, unitId?: string): string | undefined {
    return req.user.role === 'super_admin' ? unitId || undefined : req.user.unitId;
  }

  @SkipThrottle()
  @Get()
  list(@Req() req: any, @Query('unitId') unitId?: string) {
    this.ensureAdmin(req);
    return this.service.list(this.effectiveUnitId(req, unitId));
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async upsert(
    @Req() req: any,
    @Body()
    body: {
      unitId?: string;
      refMonth?: string;
      saldo?: number | string;
      admissoes?: number | string;
      desligamentos?: number | string;
      estoque?: number | string;
    },
  ) {
    this.ensureAdmin(req);
    const euid = this.effectiveUnitId(req, body?.unitId);
    if (!euid) throw new ForbiddenException('Selecione uma unidade.');
    const saved = await this.service.upsert(euid, body);
    const a = this.actor(req);
    this.audit.log({
      unitId: euid,
      actorAuthUserId: a.authUserId,
      actorName: a.name,
      actorRole: req.user.role,
      entity: 'caged',
      entityId: saved.id,
      action: 'update',
      diffAfter: {
        refMonth: saved.refMonth,
        saldo: saved.saldo,
        admissoes: saved.admissoes,
        desligamentos: saved.desligamentos,
        estoque: saved.estoque,
      },
      ip: a.ip,
      userAgent: a.userAgent,
    });
    return saved;
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    this.ensureAdmin(req);
    const a = this.actor(req);
    const removed = await this.service.remove(a, id);
    this.audit.log({
      unitId: removed.unitId,
      actorAuthUserId: a.authUserId,
      actorName: a.name,
      actorRole: req.user.role,
      entity: 'caged',
      entityId: id,
      action: 'delete',
      ip: a.ip,
      userAgent: a.userAgent,
    });
    return { ok: true };
  }
}
