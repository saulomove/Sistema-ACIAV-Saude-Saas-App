import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProvidersService } from './providers.service';

@Controller('providers')
@UseGuards(AuthGuard('jwt'))
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Get()
  findAll(
    @Query('unitId') unitId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.providersService.findAll(unitId, category, search);
  }

  @Get('ranking')
  ranking(@Query('unitId') unitId: string, @Query('limit') limit?: string) {
    return this.providersService.ranking(unitId, limit ? parseInt(limit) : 5);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.providersService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.providersService.create(body);
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
