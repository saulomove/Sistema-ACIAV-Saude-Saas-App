import { Controller, Get, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('validate/:cpf')
    async validateUser(
        @Param('cpf') cpf: string,
        @Query('unitId') unitId: string,
    ) {
        return this.usersService.validateUserByCpf(cpf, unitId);
    }
}
