import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RewardsService } from './rewards.service';

@Controller('rewards')
@UseGuards(AuthGuard('jwt'))
export class RewardsController {
  constructor(private rewardsService: RewardsService) {}

  @Get()
  findAll(@Req() req: any, @Query('unitId') unitId?: string) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : (req.user.unitId ?? unitId);
    return this.rewardsService.findAll(effectiveUnitId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rewardsService.findOne(id);
  }

  @Post()
  create(@Body() body: { providerId: string; name: string; pointsRequired: number; stock?: number }) {
    return this.rewardsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; pointsRequired?: number; stock?: number }) {
    return this.rewardsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rewardsService.remove(id);
  }
}
