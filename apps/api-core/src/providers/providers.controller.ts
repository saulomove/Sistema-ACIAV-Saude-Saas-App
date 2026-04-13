import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProvidersService } from './providers.service';

@Controller('providers')
@UseGuards(AuthGuard('jwt'))
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  private async assertTenant(req: any, providerId: string) {
    if (req.user.role === 'super_admin') return;
    const provider = await this.providersService.findOne(providerId);
    if (provider && provider.unitId !== req.user.unitId) {
      throw new ForbiddenException('Acesso negado.');
    }
  }

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
  async findOne(@Req() req: any, @Param('id') id: string) {
    await this.assertTenant(req, id);
    return this.providersService.findOne(id);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    const data = {
      unitId: req.user.unitId ?? body.unitId,
      name: body.name,
      professionalName: body.professionalName,
      clinicName: body.clinicName,
      registration: body.registration,
      cpfCnpj: body.cpfCnpj,
      category: body.category,
      specialty: body.specialty,
      address: body.address,
      phone: body.phone,
      whatsapp: body.whatsapp,
      email: body.email,
      bio: body.bio,
      discountType: body.discountType,
      discountValue: body.discountValue,
      photoUrl: body.photoUrl,
    };
    return this.providersService.create(data);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    await this.assertTenant(req, id);
    const allowed = ['professionalName', 'clinicName', 'registration', 'cpfCnpj', 'category', 'specialty', 'address', 'phone', 'whatsapp', 'email', 'bio', 'discountType', 'discountValue', 'photoUrl', 'status'];
    const data: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    return this.providersService.update(id, data);
  }

  @Patch(':id/status')
  async toggleStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: boolean }) {
    await this.assertTenant(req, id);
    return this.providersService.update(id, { status: body.status });
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.assertTenant(req, id);
    return this.providersService.remove(id);
  }

  // ─── Services ───────────────────────────────────────────────────────────────

  @Get(':id/services')
  async getServices(@Req() req: any, @Param('id') id: string) {
    await this.assertTenant(req, id);
    return this.providersService.getServices(id);
  }

  @Post(':id/services')
  async createService(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    await this.assertTenant(req, id);
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
  async getRewardsByProvider(@Req() req: any, @Param('id') id: string) {
    await this.assertTenant(req, id);
    return this.providersService.getRewardsByProvider(id);
  }

  @Post(':id/rewards')
  async createReward(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    await this.assertTenant(req, id);
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
