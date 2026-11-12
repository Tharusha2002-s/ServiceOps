import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './database/prisma.module';
import { EventsModule } from './modules/events/events.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { SlaModule } from './modules/sla/sla.module';
import { HealthModule } from './modules/health/health.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { ReportsModule } from './modules/reports/reports.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { AssetsModule } from './modules/assets/assets.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    EventsModule,
    NotificationsModule,
    AuditModule,
    CategoriesModule,
    SettingsModule,
    AuthModule,
    UsersModule,
    TicketsModule,
    SlaModule,
    HealthModule,
    IncidentsModule,
    ReportsModule,
    KnowledgeModule,
    AssetsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
