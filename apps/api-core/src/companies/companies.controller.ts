import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompaniesService } from './companies.service';

@Controller('companies')
@UseGuards(AuthGuard('jwt'))
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  findAll(@Req() req: any, @Query('unitId') unitId?: string, @Query('search') search?: string) {
    // Usuários não-super_admin só podem ver empresas da própria unidade
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : (req.user.unitId ?? unitId);
    return this.companiesService.findAll(effectiveUnitId, search);
  }

  @Get('stats')
  stats(@Req() req: any, @Query('unitId') unitId: string) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : (req.user.unitId ?? unitId);
    return this.companiesService.stats(effectiveUnitId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    const data = { ...body, unitId: req.user.unitId ?? body.unitId };
    return this.companiesService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.companiesService.update(id, body);
  }

  @Patch(':id/status')
  toggleStatus(@Param('id') id: string, @Body() body: { status: boolean }) {
    return this.companiesService.update(id, { status: body.status });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
