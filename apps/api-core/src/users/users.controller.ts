import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(
    @Query('unitId') unitId?: string,
    @Query('companyId') companyId?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
  ) {
    return this.usersService.findAll(unitId, companyId, search, type);
  }

  @Get('validate/:cpf')
  validateUser(@Param('cpf') cpf: string, @Query('unitId') unitId: string) {
    return this.usersService.validateUserByCpf(cpf, unitId);
  }

  @Post('import')
  importBatch(@Body() body: { users: Array<{ unitId: string; companyId: string; fullName: string; cpf: string; type: string }> }) {
    return this.usersService.importBatch(body.users);
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
  create(@Body() body: any) {
    return this.usersService.create(body);
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
