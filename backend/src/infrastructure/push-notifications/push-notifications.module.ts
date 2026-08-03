import { Module } from '@nestjs/common';
import { PUSH_NOTIFICATION_PORT } from './push-notification.port';
import { ConsolePushNotificationAdapter } from './console-push-notification.adapter';

@Module({
  providers: [{ provide: PUSH_NOTIFICATION_PORT, useClass: ConsolePushNotificationAdapter }],
  exports: [PUSH_NOTIFICATION_PORT],
})
export class PushNotificationsModule {}
