import { Inject, Injectable } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { UsersService } from '../../users/services/users.service';
import {
  PUSH_NOTIFICATION_PORT,
  PushNotificationPort,
} from '../../../infrastructure/push-notifications/push-notification.port';

interface CreateNotificationParams {
  userId: string;
  title: string;
  body: string;
  type?: string;
  shipmentId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly usersService: UsersService,
    @Inject(PUSH_NOTIFICATION_PORT) private readonly pushPort: PushNotificationPort,
  ) {}

  async create(params: CreateNotificationParams) {
    const notification = await this.notificationsRepository.create(params);

    const user = await this.usersService.findById(params.userId).catch(() => null);
    if (user?.fcmToken) {
      await this.pushPort.send({
        fcmToken: user.fcmToken,
        title: params.title,
        body: params.body,
        data: params.shipmentId ? { shipmentId: params.shipmentId } : undefined,
      });
    }

    return notification;
  }

  findForUser(userId: string) {
    return this.notificationsRepository.findForUser(userId);
  }

  countUnread(userId: string) {
    return this.notificationsRepository.countUnread(userId);
  }

  markRead(id: string) {
    return this.notificationsRepository.markRead(id);
  }

  markAllRead(userId: string) {
    return this.notificationsRepository.markAllRead(userId);
  }
}
