










import { createNavigationContainerRef } from '@react-navigation/native';
import { storage } from '@services/storage';

export const navigationRef = createNavigationContainerRef();

const ACCESS_TOKEN_KEY = 'access_token';
const isAuthenticated = () => !!storage.getString(ACCESS_TOKEN_KEY);

export interface NotificationTarget {
  screen: string;
  params?: Record<string, unknown>;
}













const TICKET_NOTIFICATION_TYPES = new Set([
  'SUPPORT_REPLY',
  'SUPPORT_TICKET_RESOLVED',
  'SUPPORT_TICKET_CLOSED',
]);
const DRIVER_DOCUMENT_NOTIFICATION_TYPES = new Set([
  'KYC_APPROVED',
  'KYC_REJECTED',
  'DRIVER_VERIFIED',
  'DRIVER_UNVERIFIED',
]);

export const resolveNotificationTarget = (
  type: string | null | undefined,
  shipmentId: string | null | undefined,
  ticketId?: string | null,
): NotificationTarget | null => {
  if (shipmentId) {
    return { screen: 'ShipmentDetailsScreen', params: { id: shipmentId } };
  }
  if (type && TICKET_NOTIFICATION_TYPES.has(type) && ticketId) {
    return { screen: 'TicketDetail', params: { id: ticketId } };
  }
  if (type && DRIVER_DOCUMENT_NOTIFICATION_TYPES.has(type)) {
    return { screen: 'DriverDocuments' };
  }
  if (type === 'ADMIN_BROADCAST') {
    return { screen: 'Notification' };
  }
  
  
  
  
  if (type === 'PAYOUT_ISSUED') {
    return { screen: 'DriverEarnings' };
  }
  if (type === 'REFERRAL_REWARD') {
    return { screen: 'Referral' };
  }
  return null;
};








let pendingTarget: NotificationTarget | null = null;

export const handleNotificationTap = (
  type: string | null | undefined,
  shipmentId: string | null | undefined,
  ticketId?: string | null,
) => {
  const target = resolveNotificationTarget(type, shipmentId, ticketId);
  if (!target) return;

  
  
  
  
  
  
  
  
  if (navigationRef.isReady() && isAuthenticated()) {
    (navigationRef as any).navigate(target.screen, target.params);
  } else {
    pendingTarget = target;
  }
};





export const flushPendingNotificationTarget = () => {
  if (pendingTarget && navigationRef.isReady() && isAuthenticated()) {
    (navigationRef as any).navigate(pendingTarget.screen, pendingTarget.params);
    pendingTarget = null;
  }
};
