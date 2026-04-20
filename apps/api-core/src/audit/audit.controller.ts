import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(AuthGuard('jwt'))
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('actorAuthUserId') actorAuthUserId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unitId') unitIdQuery?: string,
  ) {
    if (!['super_admin', 'admin_unit'].includes(req.user?.role)) {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }
    const unitId = req.user.role === 'super_admin' ? unitIdQuery : (req.user.unitId as string | undefined);
    if (req.user.role === 'admin_unit' && !unitId) {
      throw new ForbiddenException('Tenant não identificado.');
    }
    return this.audit.findAll({
      unitId,
      entity,
      action,
      actorAuthUserId,
      startDate,
      endDate,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
