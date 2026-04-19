import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
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
      externalCode: body.externalCode,
      corporateName: body.corporateName,
      tradeName: body.tradeName,
      cnpj: body.cnpj,
      adminEmail: body.adminEmail,
      address: body.address,
      neighborhood: body.neighborhood,
      zipCode: body.zipCode,
      city: body.city,
      state: body.state,
      phone: body.phone,
      memberSince: body.memberSince,
      dependentPaymentMode: body.dependentPaymentMode,
      defaultCardType: body.defaultCardType,
    };
    return this.companiesService.create(data);
  }

  @Post('import')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  importBatch(@Req() req: any, @Body() body: { companies: Array<Record<string, string>> }) {
    const unitId = req.user.unitId ?? body.companies?.[0]?.unitId;
    const companies = (body.companies ?? []).map((c) => ({
      unitId,
      externalCode: c.externalCode,
      corporateName: c.corporateName,
      tradeName: c.tradeName,
      cnpj: c.cnpj,
      adminEmail: c.adminEmail,
      address: c.address,
      neighborhood: c.neighborhood,
      zipCode: c.zipCode,
      city: c.city,
      state: c.state,
      memberSince: c.memberSince,
    }));
    return this.companiesService.importBatch(companies);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req.user.role !== 'super_admin') {
      const company = await this.companiesService.findOne(id);
      if (company && company.unitId !== req.user.unitId) throw new ForbiddenException('Acesso negado.');
    }
    const data: Record<string, unknown> = {};
    const allowed = [
      'corporateName', 'tradeName', 'adminEmail', 'address', 'neighborhood',
      'zipCode', 'city', 'state', 'phone', 'externalCode', 'memberSince', 'status',
      'dependentPaymentMode', 'defaultCardType',
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    return this.companiesService.update(id, data as any);
  }

  @Patch(':id/status')
  async toggleStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: boolean }) {
    if (req.user.role !== 'super_admin') {
      const company = await this.companiesService.findOne(id);
      if (company && company.unitId !== req.user.unitId) throw new ForbiddenException('Acesso negado.');
    }
    return this.companiesService.update(id, { status: body.status });
  }

  @Patch(':id/inactivate')
  async inactivate(@Req() req: any, @Param('id') id: string, @Body() body: { reason?: string }) {
    if (req.user.role !== 'super_admin') {
      const company = await this.companiesService.findOne(id);
      if (company && company.unitId !== req.user.unitId) throw new ForbiddenException('Acesso negado.');
    }
    try {
      return await this.companiesService.inactivate(id, body?.reason ?? '');
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'Erro ao inativar empresa.');
    }
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
