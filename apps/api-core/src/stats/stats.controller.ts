import { Controller, Get, Query, UseGuards, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(AuthGuard('jwt'))
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('dashboard')
  getDashboard(@Req() req: any, @Query('unitId') unitId?: string) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : req.user.unitId;
    if (!effectiveUnitId && req.user.role !== 'super_admin') {
      throw new ForbiddenException('Tenant não identificado.');
    }
    return this.statsService.getDashboardStats(effectiveUnitId);
  }

  @Get('global')
  getGlobal(@Req() req: any) {
    if (req.user?.role !== 'super_admin') {
      throw new ForbiddenException('Acesso restrito ao Super Admin.');
    }
    return this.statsService.getGlobalStats();
  }

  @Get('company')
  async getCompany(@Req() req: any, @Query('companyId') companyId: string) {
    if (!companyId) throw new BadRequestException('companyId obrigatório.');
    const role = req.user?.role;
    if (role === 'super_admin') {
      return this.statsService.getCompanyStats(companyId);
    }
    if (role === 'rh') {
      if (req.user.companyId !== companyId) {
        throw new ForbiddenException('Acesso negado.');
      }
      return this.statsService.getCompanyStats(companyId);
    }
    if (role === 'admin_unit') {
      const unitOfCompany = await this.statsService.getCompanyUnit(companyId);
      if (!unitOfCompany || unitOfCompany !== req.user.unitId) {
        throw new ForbiddenException('Acesso negado.');
      }
      return this.statsService.getCompanyStats(companyId);
    }
    throw new ForbiddenException('Acesso negado.');
  }

  @Get('billing')
  getBilling(@Req() req: any) {
    if (req.user?.role !== 'super_admin') {
      throw new ForbiddenException('Acesso restrito ao Super Admin.');
    }
    return this.statsService.getBillingStats();
  }
}
