import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PortalPacienteController } from './portal-paciente.controller';
import { PortalPacienteService } from './portal-paciente.service';

@Module({
  imports: [PrismaModule],
  controllers: [PortalPacienteController],
  providers: [PortalPacienteService],
})
export class PortalPacienteModule {}
