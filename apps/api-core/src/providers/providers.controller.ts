import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProvidersService } from './providers.service';

@Controller('providers')
@UseGuards(AuthGuard('jwt'))
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('unitId') unitId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : (req.user.unitId ?? unitId);
    return this.providersService.findAll(effectiveUnitId, category, search, Number(page) || 1, Number(limit) || 50);
  }

  @Get('ranking')
  ranking(@Req() req: any, @Query('unitId') unitId: string, @Query('limit') limit?: string) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : (req.user.unitId ?? unitId);
    return this.providersService.ranking(effectiveUnitId, limit ? parseInt(limit) : 5);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.providersService.findOne(id);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    const data = { ...body, unitId: req.user.unitId ?? body.unitId };
    return this.providersService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.providersService.update(id, body);
  }

  @Patch(':id/status')
  toggleStatus(@Param('id') id: string, @Body() body: { status: boolean }) {
    return this.providersService.update(id, { status: body.status });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.providersService.remove(id);
  }

  // ─── Services ───────────────────────────────────────────────────────────────

  @Get(':id/services')
  getServices(@Param('id') id: string) {
    return this.providersService.getServices(id);
  }

  @Post(':id/services')
  createService(@Param('id') id: string, @Body() body: any) {
    return this.providersService.createService(id, body);
  }

  @Put('services/:serviceId')
  updateService(@Param('serviceId') serviceId: string, @Body() body: any) {
    return this.providersService.updateService(serviceId, body);
  }

  @Delete('services/:serviceId')
  deleteService(@Param('serviceId') serviceId: string) {
    return this.providersService.deleteService(serviceId);
  }

  // ─── Rewards ────────────────────────────────────────────────────────────────

  @Get('rewards/by-unit')
  getRewardsByUnit(@Req() req: any, @Query('unitId') unitId?: string) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : (req.user.unitId ?? unitId);
    return this.providersService.getRewardsByUnit(effectiveUnitId ?? '');
  }

  @Get(':id/rewards')
  getRewardsByProvider(@Param('id') id: string) {
    return this.providersService.getRewardsByProvider(id);
  }

  @Post(':id/rewards')
  createReward(@Param('id') id: string, @Body() body: any) {
    return this.providersService.createReward(id, body);
  }

  @Put('rewards/:rewardId')
  updateReward(@Param('rewardId') rewardId: string, @Body() body: any) {
    return this.providersService.updateReward(rewardId, body);
  }

  @Delete('rewards/:rewardId')
  deleteReward(@Param('rewardId') rewardId: string) {
    return this.providersService.deleteReward(rewardId);
  }
}
