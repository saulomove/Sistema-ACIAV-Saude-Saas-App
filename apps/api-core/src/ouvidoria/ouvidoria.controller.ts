import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { OuvidoriaService } from './ouvidoria.service';
import { AuditService } from '../audit/audit.service';

@Controller('ouvidoria')
@UseGuards(AuthGuard('jwt'))
export class OuvidoriaController {
  constructor(
    private readonly service: OuvidoriaService,
    private readonly audit: AuditService,
  ) {}

  private actor(req: any) {
    return {
      authUserId: req.user.sub,
      userId: req.user.userId ?? null,
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

  // Beneficiário registra uma manifestação de ouvidoria.
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async create(@Req() req: any, @Body() body: { categoria?: string; assunto?: string; mensagem?: string }) {
    if (req.user?.role !== 'patient') throw new ForbiddenException('Acesso restrito a beneficiários.');
    const actor = this.actor(req);
    const created = await this.service.create(actor, body);
    this.audit.log({
      unitId: actor.unitId,
      actorAuthUserId: actor.authUserId,
      actorName: actor.name,
      actorRole: req.user.role,
      entity: 'ouvidoria',
      entityId: created.id,
      action: 'create',
      diffAfter: { categoria: (body.categoria || '').toLowerCase(), assunto: (body.assunto || '').trim() },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
    return created;
  }

  // ACIAV (admin) lista as manifestações da própria unidade.
  // super_admin pode filtrar por unitId; admin_unit é sempre travado na sua unit.
  @SkipThrottle()
  @Get()
  list(
    @Req() req: any,
    @Query('unitId') unitId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.ensureAdmin(req);
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId || undefined : req.user.unitId;
    if (!effectiveUnitId && req.user.role !== 'super_admin') {
      throw new ForbiddenException('Tenant não identificado.');
    }
    return this.service.list(effectiveUnitId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch(':id/status')
  async updateStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: string }) {
    this.ensureAdmin(req);
    const actor = this.actor(req);
    const updated = await this.service.updateStatus(actor, id, body?.status);
    this.audit.log({
      unitId: updated.unitId,
      actorAuthUserId: actor.authUserId,
      actorName: actor.name,
      actorRole: req.user.role,
      entity: 'ouvidoria',
      entityId: id,
      action: 'status_change',
      diffAfter: { status: updated.status },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
    return updated;
  }
}
