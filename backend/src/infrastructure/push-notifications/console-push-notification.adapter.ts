import { Injectable, Logger } from '@nestjs/common';
import { PushNotificationPayload, PushNotificationPort } from './push-notification.port';

@Injectable()
export class ConsolePushNotificationAdapter implements PushNotificationPort {
  private readonly logger = new Logger(ConsolePushNotificationAdapter.name);

  async send(payload: PushNotificationPayload): Promise<void> {
    this.logger.log(`[push] -> ${payload.fcmToken.slice(0, 12)}… : ${payload.title} — ${payload.body}`);
  }
}
