import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompaniesService } from './companies.service';

@Controller('companies')
@UseGuards(AuthGuard('jwt'))
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  findAll(@Req() req: any, @Query('unitId') unitId?: string, @Query('search') search?: string) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : (req.user.unitId ?? unitId);
    return this.companiesService.findAll(effectiveUnitId, search);
  }

  @Get('stats')
  stats(@Req() req: any, @Query('unitId') unitId: string) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : (req.user.unitId ?? unitId);
    return this.companiesService.stats(effectiveUnitId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const company = await this.companiesService.findOne(id);
    if (company && req.user.role !== 'super_admin' && company.unitId !== req.user.unitId) {
      throw new ForbiddenException('Acesso negado.');
    }
    return company;
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    const data = {
      unitId: req.user.unitId ?? body.unitId,
      corporateName: body.corporateName,
      cnpj: body.cnpj,
      adminEmail: body.adminEmail,
    };
    return this.companiesService.create(data);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req.user.role !== 'super_admin') {
      const company = await this.companiesService.findOne(id);
      if (company && company.unitId !== req.user.unitId) throw new ForbiddenException('Acesso negado.');
    }
    const data: any = {};
    if (body.corporateName !== undefined) data.corporateName = body.corporateName;
    if (body.adminEmail !== undefined) data.adminEmail = body.adminEmail;
    if (body.status !== undefined) data.status = body.status;
    return this.companiesService.update(id, data);
  }

  @Patch(':id/status')
  async toggleStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: boolean }) {
    if (req.user.role !== 'super_admin') {
      const company = await this.companiesService.findOne(id);
      if (company && company.unitId !== req.user.unitId) throw new ForbiddenException('Acesso negado.');
    }
    return this.companiesService.update(id, { status: body.status });
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'super_admin') {
      const company = await this.companiesService.findOne(id);
      if (company && company.unitId !== req.user.unitId) throw new ForbiddenException('Acesso negado.');
    }
    return this.companiesService.remove(id);
  }
}
