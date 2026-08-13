import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { CagedController } from './caged.controller';
import { CagedService } from './caged.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [CagedController],
  providers: [CagedService],
})
export class CagedModule {}
