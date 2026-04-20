import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RewardsService } from './rewards.service';

@Controller('rewards')
@UseGuards(AuthGuard('jwt'))
export class RewardsController {
  constructor(private rewardsService: RewardsService) {}

  private async assertTenant(req: any, rewardId: string) {
    if (req.user.role === 'super_admin') return;
    const reward = await this.rewardsService.findOne(rewardId);
    if (reward?.provider?.unitId && reward.provider.unitId !== req.user.unitId) {
      throw new ForbiddenException('Acesso negado.');
    }
  }

  private async assertProviderTenant(req: any, providerId: string) {
    if (req.user.role === 'super_admin') return;
    if (!providerId) throw new BadRequestException('providerId obrigatório.');
    const providerUnitId = await this.rewardsService.getProviderUnit(providerId);
    if (!providerUnitId || providerUnitId !== req.user.unitId) {
      throw new ForbiddenException('Acesso negado.');
    }
  }

  @Get()
  findAll(@Req() req: any, @Query('unitId') unitId?: string) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : req.user.unitId;
    if (!effectiveUnitId && req.user.role !== 'super_admin') {
      throw new ForbiddenException('Tenant não identificado.');
    }
    return this.rewardsService.findAll(effectiveUnitId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    await this.assertTenant(req, id);
    return this.rewardsService.findOne(id);
  }

  @Post()
  async create(@Req() req: any, @Body() body: { providerId: string; name: string; pointsRequired: number; stock?: number }) {
    await this.assertProviderTenant(req, body.providerId);
    return this.rewardsService.create(body);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: { name?: string; pointsRequired?: number; stock?: number }) {
    await this.assertTenant(req, id);
    return this.rewardsService.update(id, body);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.assertTenant(req, id);
    return this.rewardsService.remove(id);
  }
}
