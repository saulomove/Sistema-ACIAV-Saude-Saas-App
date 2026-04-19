import { Controller, ForbiddenException, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { BackupService } from './backup.service';

const ADMIN_ROLES = new Set(['super_admin', 'admin_unit']);

@Controller('backup')
@UseGuards(AuthGuard('jwt'))
export class BackupController {
  constructor(private readonly service: BackupService) {}

  private ensureAdmin(req: Request & { user?: any }) {
    const user = req.user;
    if (!user || !ADMIN_ROLES.has(user.role)) {
      throw new ForbiddenException('Acesso restrito à administração.');
    }
    return user;
  }

  private scopedUnitId(user: any): string | null {
    if (user.role === 'super_admin') return user.unitId ?? null;
    return user.unitId ?? null;
  }

  @Get()
  async list(@Req() req: Request & { user?: any }) {
    const user = this.ensureAdmin(req);
    const unitId = this.scopedUnitId(user);
    return this.service.list(unitId);
  }

  @Post('run')
  @HttpCode(HttpStatus.CREATED)
  async run(@Req() req: Request & { user?: any }) {
    const user = this.ensureAdmin(req);
    const unitId = this.scopedUnitId(user);
    return this.service.runBackup(unitId, {
      authUserId: user.sub,
      name: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Get(':id/download')
  async download(@Req() req: Request & { user?: any }, @Param('id') id: string, @Res() res: Response) {
    const user = this.ensureAdmin(req);
    const scope = user.role === 'super_admin' ? null : (user.unitId ?? null);
    const { buffer, fileName } = await this.service.getDownload(id, scope);
    if (!buffer) throw new NotFoundException();
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }
}
