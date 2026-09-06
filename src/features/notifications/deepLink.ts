// Centralized notification -> screen routing.
//
// Was completely missing before this: onNotificationOpenedApp (background
// tap) and getInitialNotification (killed-app tap) in utils/cm.ts just
// console.log'd the payload and did nothing; the in-app Notifications list
// (notification.tsx) only marked a tapped row read; the driver Home
// screen's foreground Alert was the ONLY place that ever navigated
// anywhere, and it hardcoded `navigation.navigate('ShipmentDetailsScreen',
// ...)` inline rather than through one shared resolver. This file is that
// one shared resolver + the navigationRef needed to navigate from outside
// a component (FCM listeners live outside React's tree).
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export interface NotificationTarget {
    screen: string;
    params?: Record<string, unknown>;
}

// Every notification `type` this app's backend actually emits today
// (kalanabhaBackend NotificationsListener) maps to a real screen — no
// invented LOAD/TRIP/KYC/EARNING types from a generic template that this
// backend has no concept of. All shipment-related types land on the same
// ShipmentDetailsScreen both apps already use (it renders correctly for
// every real status). ADMIN_BROADCAST has no shipmentId and nothing more
// specific to open, so it goes to the Notifications list itself.
export const resolveNotificationTarget = (
    type: string | null | undefined,
    shipmentId: string | null | undefined,
): NotificationTarget | null => {
    if (shipmentId) {
        return { screen: 'ShipmentDetailsScreen', params: { id: shipmentId } };
    }
    if (type === 'ADMIN_BROADCAST') {
        return { screen: 'Notification' };
    }
    return null;
};

// FCM listeners (utils/cm.ts) and the in-app Notifications list fire
// before the NavigationContainer is necessarily mounted/ready (a killed
// app opened by tapping a notification runs getInitialNotification before
// the first screen has rendered). This holds at most one pending target —
// the last tap wins, matching how a real device only ever has one
// notification actually being "opened" at a time — and is flushed once
// navigationRef.onReady() fires.
let pendingTarget: NotificationTarget | null = null;

export const handleNotificationTap = (type: string | null | undefined, shipmentId: string | null | undefined) => {
    const target = resolveNotificationTarget(type, shipmentId);
    if (!target) return;

    if (navigationRef.isReady()) {
        (navigationRef as any).navigate(target.screen, target.params);
    } else {
        pendingTarget = target;
    }
};

// Called once from NavigationContainer's onReady in App.tsx.
export const flushPendingNotificationTarget = () => {
    if (pendingTarget && navigationRef.isReady()) {
        (navigationRef as any).navigate(pendingTarget.screen, pendingTarget.params);
        pendingTarget = null;
    }
};
