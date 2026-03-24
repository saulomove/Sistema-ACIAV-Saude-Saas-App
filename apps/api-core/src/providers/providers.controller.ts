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
  ) {
    // Usuários não-super_admin só podem ver credenciados da própria unidade
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : (req.user.unitId ?? unitId);
    return this.providersService.findAll(effectiveUnitId, category, search);
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
}
