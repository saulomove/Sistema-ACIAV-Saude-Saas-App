import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { OuvidoriaController } from './ouvidoria.controller';
import { OuvidoriaService } from './ouvidoria.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [OuvidoriaController],
  providers: [OuvidoriaService],
})
export class OuvidoriaModule {}
