import { acceptShipment as acceptShipmentRequest } from '../features/shipments/api/shipments.api';

/**
 * @deprecated Prefer `useAcceptShipment` from features/shipments/hooks (it
 * also invalidates the mine/searching/admin/detail caches on success).
 *
 * Was a client-side Firestore transaction guarded by `status == 'searching'`
 * (self-service, spoofable). Now POST /shipments/:id/accept — the backend's
 * DispatchService.acceptShipment does the same atomic guard server-side via
 * an `updateMany({ status: 'SEARCHING' })` WHERE clause, so a driver can no
 * longer race or fake an accept from the client.
 */
export const acceptShipment = async ({ shipmentId }: { shipmentId: string }): Promise<void> => {
    await acceptShipmentRequest(shipmentId);
};

/**
 * @deprecated Auto-matching now happens server-side, inside
 * ShipmentsService.create (kalanabhaBackend), immediately after a shipment
 * is inserted — the client no longer needs to run this itself, and this
 * function is a no-op kept only so any remaining call site doesn't crash.
 */
export const autoMatchShipment = async (_params: {
    shipmentId: string;
    trackingId: string;
    pickup: { lat: number; lng: number };
    vehicleType: string;
}): Promise<boolean> => {
    return false;
};
