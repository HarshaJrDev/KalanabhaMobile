import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '../database/database.module';
import { validateEnv } from '../config/env.validation';
import appConfig from '../config/app.config';
import jwtConfig from '../config/jwt.config';
import databaseConfig from '../config/database.config';
import { AuthModule } from '../modules/auth/auth.module';
import { UsersModule } from '../modules/users/users.module';
import { RolesModule } from '../modules/roles/roles.module';
import { PermissionsModule } from '../modules/permissions/permissions.module';
import { CustomersModule } from '../modules/customers/customers.module';
import { DriversModule } from '../modules/drivers/drivers.module';
import { VehiclesModule } from '../modules/vehicles/vehicles.module';
import { BookingsModule } from '../modules/bookings/bookings.module';
import { ShipmentsModule } from '../modules/shipments/shipments.module';
import { TrackingModule } from '../modules/tracking/tracking.module';
import { DispatchModule } from '../modules/dispatch/dispatch.module';
import { WarehousesModule } from '../modules/warehouses/warehouses.module';
import { InventoryModule } from '../modules/inventory/inventory.module';
import { BranchesModule } from '../modules/branches/branches.module';
import { PaymentsModule } from '../modules/payments/payments.module';
import { InvoicesModule } from '../modules/invoices/invoices.module';
import { PricingModule } from '../modules/pricing/pricing.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { ChatModule } from '../modules/chat/chat.module';
import { FilesModule } from '../modules/files/files.module';
import { DashboardModule } from '../modules/dashboard/dashboard.module';
import { ReportsModule } from '../modules/reports/reports.module';
import { AnalyticsModule } from '../modules/analytics/analytics.module';
import { SettingsModule } from '../modules/settings/settings.module';
import { AuditLogsModule } from '../modules/audit-logs/audit-logs.module';
import { ActivityLogsModule } from '../modules/activity-logs/activity-logs.module';
import { SupportModule } from '../modules/support/support.module';
import { SystemModule } from '../modules/system/system.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, databaseConfig],
      validate: validateEnv,
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    CustomersModule,
    DriversModule,
    VehiclesModule,
    BookingsModule,
    ShipmentsModule,
    TrackingModule,
    DispatchModule,
    WarehousesModule,
    InventoryModule,
    BranchesModule,
    PaymentsModule,
    InvoicesModule,
    PricingModule,
    NotificationsModule,
    ChatModule,
    FilesModule,
    DashboardModule,
    ReportsModule,
    AnalyticsModule,
    SettingsModule,
    AuditLogsModule,
    ActivityLogsModule,
    SupportModule,
    SystemModule,

  ],
})
export class AppModule {}
