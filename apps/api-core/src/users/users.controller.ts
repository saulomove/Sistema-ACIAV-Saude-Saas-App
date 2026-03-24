import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
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
  ) {
    // Usuários não-super_admin só podem ver dados da própria unidade
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : (req.user.unitId ?? unitId);
    // RH só pode ver usuários da própria empresa
    const effectiveCompanyId = req.user.role === 'rh' ? (req.user.companyId ?? companyId) : companyId;
    return this.usersService.findAll(effectiveUnitId, effectiveCompanyId, search, type);
  }

  @Get('validate/:cpf')
  validateUser(@Param('cpf') cpf: string, @Query('unitId') unitId: string) {
    return this.usersService.validateUserByCpf(cpf, unitId);
  }

  @Post('import')
  importBatch(
    @Req() req: any,
    @Body() body: { users: Array<{ unitId: string; companyId: string; fullName: string; cpf: string; type: string }> },
  ) {
    // Força unitId e companyId do token para evitar import cross-tenant
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
  getUserTransactions(@Param('id') id: string) {
    return this.usersService.getUserTransactions(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    // Força unitId do token para garantir isolamento de tenant
    const data = { ...body, unitId: req.user.unitId ?? body.unitId };
    return this.usersService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  @Patch(':id/status')
  toggleStatus(@Param('id') id: string, @Body() body: { status: boolean }) {
    return this.usersService.update(id, { status: body.status });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
