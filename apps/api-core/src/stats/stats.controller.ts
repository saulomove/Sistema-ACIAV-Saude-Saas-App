import { Controller, Get, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(AuthGuard('jwt'))
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('dashboard')
  getDashboard(@Query('unitId') unitId?: string) {
    return this.statsService.getDashboardStats(unitId);
  }

  @Get('global')
  getGlobal(@Req() req: any) {
    if (req.user?.role !== 'super_admin') {
      throw new ForbiddenException('Acesso restrito ao Super Admin.');
    }
    return this.statsService.getGlobalStats();
  }

  @Get('company')
  getCompany(@Query('companyId') companyId: string) {
    return this.statsService.getCompanyStats(companyId);
  }
}
