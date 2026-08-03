import { Module } from '@nestjs/common';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationsListener } from './events/notifications.listener';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PushNotificationsModule } from '../../infrastructure/push-notifications/push-notifications.module';

@Module({
  imports: [AuthModule, UsersModule, PushNotificationsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository, NotificationsListener],
  exports: [NotificationsService],
})
export class NotificationsModule {}
