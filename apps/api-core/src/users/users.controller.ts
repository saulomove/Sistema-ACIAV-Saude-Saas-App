import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
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
}
