import { Module } from '@nestjs/common';
import { AuthUsersController } from './auth-users.controller';
import { AuthUsersService } from './auth-users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, EmailModule, AuditModule],
  controllers: [AuthUsersController],
  providers: [AuthUsersService],
  exports: [AuthUsersService],
})
export class AuthUsersModule {}
