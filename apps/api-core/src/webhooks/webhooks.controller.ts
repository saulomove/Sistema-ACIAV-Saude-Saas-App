import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { WebhooksService } from './webhooks.service';

const ADMIN_ROLES = new Set(['super_admin', 'admin_unit']);

@Controller('webhooks')
@UseGuards(AuthGuard('jwt'))
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  private ensureAdmin(req: Request & { user?: any }) {
    const user = req.user;
    if (!user || !ADMIN_ROLES.has(user.role)) {
      throw new ForbiddenException('Acesso restrito à administração.');
    }
    return user;
  }

  private resolveUnitId(user: any, requested?: string): string {
    if (user.role === 'admin_unit') {
      if (!user.unitId) throw new BadRequestException('Unidade não vinculada ao usuário.');
      return user.unitId;
    }
    const scope = requested ?? user.unitId;
    if (!scope) throw new BadRequestException('unitId é obrigatório.');
    return scope;
  }

  @Get()
  async list(@Req() req: Request & { user?: any }, @Query('unitId') unitId?: string) {
    const user = this.ensureAdmin(req);
    const scoped = this.resolveUnitId(user, unitId);
    return this.service.list(scoped);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request & { user?: any },
    @Body() body: { unitId?: string; url: string; events: string },
  ) {
    const user = this.ensureAdmin(req);
    const unitId = this.resolveUnitId(user, body.unitId);
    if (!body.url || !body.events) throw new BadRequestException('url e events são obrigatórios.');
    return this.service.create(unitId, { url: body.url, events: body.events }, {
      authUserId: user.sub,
      name: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Delete(':id')
  async remove(@Req() req: Request & { user?: any }, @Param('id') id: string) {
    const user = this.ensureAdmin(req);
    const unitId = this.resolveUnitId(user);
    return this.service.remove(unitId, id, {
      authUserId: user.sub,
      name: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  async test(@Req() req: Request & { user?: any }, @Param('id') id: string) {
    const user = this.ensureAdmin(req);
    const unitId = this.resolveUnitId(user);
    return this.service.sendTest(unitId, id);
  }
}
