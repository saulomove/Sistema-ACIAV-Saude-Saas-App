import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
  getGlobal() {
    return this.statsService.getGlobalStats();
  }
}
