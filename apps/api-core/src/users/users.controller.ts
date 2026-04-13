import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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
  importBatch(
    @Req() req: any,
    @Body() body: { users: Array<{ unitId: string; companyId: string; fullName: string; cpf: string; type: string }> },
  ) {
    const users = body.users.map((u) => ({
      ...u,
      unitId: req.user.unitId ?? u.unitId,
      companyId: req.user.companyId ?? u.companyId,
    }));
    return this.usersService.importBatch(users);
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
  create(@Req() req: any, @Body() body: any) {
    const data = {
      unitId: req.user.unitId ?? body.unitId,
      companyId: body.companyId,
      fullName: body.fullName,
      cpf: body.cpf,
      type: body.type,
      parentId: body.parentId,
    };
    return this.usersService.create(data);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req.user.role !== 'super_admin') {
      const user = await this.usersService.findOne(id);
      if (user && user.unitId !== req.user.unitId) throw new ForbiddenException('Acesso negado.');
    }
    const data: any = {};
    if (body.fullName !== undefined) data.fullName = body.fullName;
    if (body.status !== undefined) data.status = body.status;
    if (body.companyId !== undefined) data.companyId = body.companyId;
    return this.usersService.update(id, data);
  }

  @Patch(':id/status')
  async toggleStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: boolean }) {
    if (req.user.role !== 'super_admin') {
      const user = await this.usersService.findOne(id);
      if (user && user.unitId !== req.user.unitId) throw new ForbiddenException('Acesso negado.');
    }
    return this.usersService.update(id, { status: body.status });
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
