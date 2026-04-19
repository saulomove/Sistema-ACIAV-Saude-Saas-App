import { Module } from '@nestjs/common';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [PrismaModule, AuditModule, ExportModule],
  controllers: [UnitsController],
  providers: [UnitsService],
})
export class UnitsModule {}
