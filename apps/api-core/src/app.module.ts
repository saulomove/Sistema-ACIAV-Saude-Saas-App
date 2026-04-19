import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { UnitsModule } from './units/units.module';
import { CompaniesModule } from './companies/companies.module';
import { ProvidersModule } from './providers/providers.module';
import { StatsModule } from './stats/stats.module';
import { TransactionsModule } from './transactions/transactions.module';
import { RewardsModule } from './rewards/rewards.module';
import { AuditModule } from './audit/audit.module';
import { AuditInterceptor } from './audit/audit.interceptor';
import { ExportModule } from './export/export.module';
import { EmailModule } from './email/email.module';
import { PortalPacienteModule } from './portal-paciente/portal-paciente.module';
import { PortalRhModule } from './portal-rh/portal-rh.module';
import { AuthUsersModule } from './auth-users/auth-users.module';
import { BackupModule } from './backup/backup.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { CategoriesModule } from './categories/categories.module';
import { ReadOnlyProviderGuard } from './common/guards/read-only-role.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    PrismaModule,
    AuditModule,
    EmailModule,
    AuthModule,
    UsersModule,
    UnitsModule,
    CompaniesModule,
    ProvidersModule,
    StatsModule,
    TransactionsModule,
    RewardsModule,
    ExportModule,
    PortalPacienteModule,
    PortalRhModule,
    AuthUsersModule,
    BackupModule,
    WebhooksModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: ReadOnlyProviderGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
