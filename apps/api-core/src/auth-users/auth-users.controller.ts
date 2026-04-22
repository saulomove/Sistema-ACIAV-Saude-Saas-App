import { Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthUsersService } from './auth-users.service';

const ADMIN_ROLES = ['super_admin', 'admin_unit'];

function getActorContext(req: Request & { user?: any }) {
  const user = req.user ?? {};
  return {
    authUserId: user.sub,
    role: user.role,
    unitId: user.unitId ?? null,
    name: user.email ?? null,
    ip: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? null,
    userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
  };
}

@Controller('auth-users')
@UseGuards(AuthGuard('jwt'))
export class AuthUsersController {
  constructor(private service: AuthUsersService) {}

  @Get()
  async list(@Req() req: Request & { user?: any }, @Query('unitId') unitId?: string, @Query('role') role?: string) {
    if (!ADMIN_ROLES.includes(req.user?.role)) throw new ForbiddenException();
    let scopedUnit = unitId;
    if (req.user.role === 'admin_unit') scopedUnit = req.user.unitId;
    let roles = role ? role.split(',').map((r) => r.trim()).filter(Boolean) : undefined;
    if (req.user.role === 'admin_unit') {
      roles = (roles ?? ['admin_unit']).filter((r) => r !== 'super_admin');
      if (roles.length === 0) roles = ['admin_unit'];
    }
    return this.service.list({ unitId: scopedUnit, roles });
  }

  @Get('counts')
  async counts(@Req() req: Request & { user?: any }, @Query('unitId') unitId?: string) {
    if (!ADMIN_ROLES.includes(req.user?.role)) throw new ForbiddenException();
    const scoped = req.user.role === 'admin_unit' ? req.user.unitId : unitId;
    const result = await this.service.counts(scoped ?? '');
    if (req.user.role === 'admin_unit') {
      return { ...result, super_admin: 0 };
    }
    return result;
  }

  @Post('invite')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  async invite(
    @Req() req: Request & { user?: any },
    @Body() body: { email: string; name: string; role: string; unitId: string },
  ) {
    const actor = getActorContext(req);
    const targetUnit = req.user.role === 'admin_unit' ? req.user.unitId : body.unitId;
    return this.service.invite({ ...body, unitId: targetUnit }, actor);
  }

  @Patch(':id')
  async update(
    @Req() req: Request & { user?: any },
    @Param('id') id: string,
    @Body() body: { role?: string; status?: boolean },
  ) {
    const actor = getActorContext(req);
    const patch: { role?: string; status?: boolean } = {};
    if (body.role !== undefined) patch.role = body.role;
    if (body.status !== undefined) patch.status = !!body.status;
    return this.service.update(id, patch, actor);
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async resetPassword(@Req() req: Request & { user?: any }, @Param('id') id: string) {
    const actor = getActorContext(req);
    return this.service.resetPassword(id, actor);
  }
}
