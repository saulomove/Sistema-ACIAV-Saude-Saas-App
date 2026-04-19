import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { PortalPacienteController } from './portal-paciente.controller';
import { PortalPacienteService } from './portal-paciente.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PortalPacienteController],
  providers: [PortalPacienteService],
})
export class PortalPacienteModule {}
