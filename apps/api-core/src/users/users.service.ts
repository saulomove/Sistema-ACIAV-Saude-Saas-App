import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async validateUserByCpf(cpf: string, unitId: string) {
        if (!cpf || !unitId) {
            throw new BadRequestException('CPF e unitId são obrigatórios');
        }

        const user = await this.prisma.user.findFirst({
            where: {
                cpf,
                unitId,
                status: true,
            },
            include: {
                dependents: true,
                company: true,
            }
        });

        if (!user) {
            throw new NotFoundException('Usuário não encontrado ou inativo nesta unidade');
        }

        return user;
    }
}
