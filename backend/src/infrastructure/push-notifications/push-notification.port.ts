export interface PushNotificationPayload {
  fcmToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export const PUSH_NOTIFICATION_PORT = Symbol('PUSH_NOTIFICATION_PORT');

export interface PushNotificationPort {
  send(payload: PushNotificationPayload): Promise<void>;
}
