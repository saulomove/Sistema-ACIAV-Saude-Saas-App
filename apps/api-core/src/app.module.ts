import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { UnitsModule } from './units/units.module';
import { CompaniesModule } from './companies/companies.module';
import { ProvidersModule } from './providers/providers.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    UnitsModule,
    CompaniesModule,
    ProvidersModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
