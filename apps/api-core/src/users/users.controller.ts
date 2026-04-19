import {
  Controller, Get, Post, Put, Delete, Patch,
  Param, Body, Query, UseGuards, Req, ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('unitId') unitId?: string,
    @Query('companyId') companyId?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : (req.user.unitId ?? unitId);
    const effectiveCompanyId = req.user.role === 'rh' ? (req.user.companyId ?? companyId) : companyId;
    return this.usersService.findAll(effectiveUnitId, effectiveCompanyId, search, type, Number(page) || 1, Number(limit) || 50);
  }

  @Get('validate/:cpf')
  validateUser(@Req() req: any, @Param('cpf') cpf: string, @Query('unitId') unitId: string) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : (req.user.unitId ?? unitId);
    return this.usersService.validateUserByCpf(cpf, effectiveUnitId);
  }

  @Post('import')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  importBatch(
    @Req() req: any,
    @Body() body: {
      users: Array<{
        externalCode?: string;
        fullName: string;
        cpf: string;
        type?: string;
        parentExternalCode?: string;
        proponentName?: string;
        gender?: string;
        birthDate?: string;
        phone?: string;
        kinship?: string;
        billingName?: string;
        memberSince?: string;
      }>;
    },
  ) {
    if (!['super_admin', 'admin_unit'].includes(req.user?.role)) {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }
    const effectiveUnitId = req.user.unitId;
    if (!effectiveUnitId && req.user.role !== 'super_admin') {
      throw new ForbiddenException('unitId não disponível.');
    }

    const sanitized = body.users.map((u) => ({
      externalCode: u.externalCode?.trim() || undefined,
      fullName: (u.fullName ?? '').trim(),
      cpf: (u.cpf ?? '').trim(),
      type: u.type || 'titular',
      parentExternalCode: u.parentExternalCode?.trim() || undefined,
      proponentName: u.proponentName?.trim() || undefined,
      gender: u.gender?.trim() || undefined,
      birthDate: u.birthDate?.trim() || undefined,
      phone: u.phone?.trim() || undefined,
      kinship: u.kinship?.trim() || undefined,
      billingName: u.billingName?.trim() || undefined,
      memberSince: u.memberSince?.trim() || undefined,
    }));

    return this.usersService.importBatch(effectiveUnitId, sanitized);
  }

  @Get('me/card')
  getMyCard(@Req() req: any) {
    return this.usersService.getPatientCard(req.user.userId);
  }

  @Get(':id/transactions')
  async getUserTransactions(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'super_admin') {
      const user = await this.usersService.findOne(id);
      if (user && user.unitId !== req.user.unitId) throw new ForbiddenException('Acesso negado.');
    }
    return this.usersService.getUserTransactions(id);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (user && req.user.role !== 'super_admin' && user.unitId !== req.user.unitId) {
      throw new ForbiddenException('Acesso negado.');
    }
    return user;
  }

  @Post()
  create(@Req() req: any, @Query('confirmTransfer') confirmTransfer?: string, @Body() body: any = {}) {
    const data = {
      unitId: req.user.unitId ?? body.unitId,
      companyId: body.companyId || undefined,
      externalCode: body.externalCode?.trim() || undefined,
      fullName: (body.fullName ?? '').trim(),
      cpf: (body.cpf ?? '').trim(),
      type: body.type || 'titular',
      parentId: body.parentId || undefined,
      gender: body.gender?.trim() || undefined,
      birthDate: body.birthDate?.trim() || undefined,
      phone: body.phone?.trim() || undefined,
      kinship: body.kinship?.trim() || undefined,
      billingName: body.billingName?.trim() || undefined,
      memberSince: body.memberSince?.trim() || undefined,
      cardTypeOverride: body.cardTypeOverride?.trim() || undefined,
      confirmTransfer: confirmTransfer === 'true' || body.confirmTransfer === true,
    };
    return this.usersService.create(data);
  }

  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Query('confirmTransfer') confirmTransfer?: string,
    @Body() body: any = {},
  ) {
    if (req.user.role !== 'super_admin') {
      const user = await this.usersService.findOne(id);
      if (user && user.unitId !== req.user.unitId) throw new ForbiddenException('Acesso negado.');
    }
    const data: Record<string, unknown> = {};
    if (body.fullName !== undefined) data.fullName = body.fullName;
    if (body.status !== undefined) data.status = body.status;
    if (body.companyId !== undefined) data.companyId = body.companyId;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.gender !== undefined) data.gender = body.gender;
    if (body.kinship !== undefined) data.kinship = body.kinship;
    if (body.billingName !== undefined) data.billingName = body.billingName;
    if (body.externalCode !== undefined) data.externalCode = body.externalCode;
    if (body.birthDate !== undefined) data.birthDate = body.birthDate;
    if (body.memberSince !== undefined) data.memberSince = body.memberSince;
    if (body.cardTypeOverride !== undefined) {
      const v = (body.cardTypeOverride ?? '').toString().trim();
      data.cardTypeOverride = v === '' ? null : v;
    }
    data.confirmTransfer = confirmTransfer === 'true' || body.confirmTransfer === true;
    return this.usersService.update(id, data as any);
  }

  @Patch(':id/status')
  async toggleStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: boolean }) {
    if (req.user.role !== 'super_admin') {
      const user = await this.usersService.findOne(id);
      if (user && user.unitId !== req.user.unitId) throw new ForbiddenException('Acesso negado.');
    }
    return this.usersService.update(id, { status: body.status });
  }

  @Post(':id/inactivate')
  async inactivate(@Req() req: any, @Param('id') id: string, @Body() body: { reason: string }) {
    if (req.user.role !== 'super_admin') {
      const user = await this.usersService.findOne(id);
      if (!user || user.unitId !== req.user.unitId) throw new ForbiddenException('Acesso negado.');
      if (req.user.role === 'rh' && user.companyId !== req.user.companyId) {
        throw new ForbiddenException('Acesso negado.');
      }
    }
    return this.usersService.inactivateWithReason(id, body?.reason ?? '');
  }

  @Post(':id/reactivate')
  async reactivate(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'super_admin') {
      const user = await this.usersService.findOne(id);
      if (!user || user.unitId !== req.user.unitId) throw new ForbiddenException('Acesso negado.');
      if (req.user.role === 'rh' && user.companyId !== req.user.companyId) {
        throw new ForbiddenException('Acesso negado.');
      }
    }
    return this.usersService.reactivate(id);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'super_admin') {
      const user = await this.usersService.findOne(id);
      if (user && user.unitId !== req.user.unitId) throw new ForbiddenException('Acesso negado.');
    }
    return this.usersService.remove(id);
  }
}
