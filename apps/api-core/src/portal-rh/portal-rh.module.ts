import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PortalRhController } from './portal-rh.controller';
import { PortalRhService } from './portal-rh.service';

@Module({
  imports: [PrismaModule],
  controllers: [PortalRhController],
  providers: [PortalRhService],
})
export class PortalRhModule {}
