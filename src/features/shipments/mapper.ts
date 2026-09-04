import type { Shipment, ShipmentStatus } from '@shipment/types';
import type { BackendShipment } from './types';

const STATUS_MAP: Record<BackendShipment['status'], ShipmentStatus> = {
    SEARCHING: 'searching',
    ACCEPTED: 'accepted',
    IN_TRANSIT: 'in_transit',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
};

// Adapts the backend's flat Prisma row to the shape the app's screens
// already render (shipment/types.ts::Shipment) — pickup/drop nested,
// lowercase status — so existing UI/render code needs no changes.
export const toShipment = (row: BackendShipment): Shipment => ({
    id: row.id,
    shipmentId: row.shipmentId,
    userId: row.customerId,
    trackingId: row.trackingId,
    goodsType: row.goodsType,
    weightKg: row.weightKg,
    pickup: { address: row.pickupAddress, lat: row.pickupLat, lng: row.pickupLng },
    drop: { address: row.dropAddress, lat: row.dropLat, lng: row.dropLng },
    price: row.price,
    distanceKm: row.distanceKm,
    sender: row.sender,
    receiver: row.receiver,
    package: row.package,
    from: row.from,
    to: row.to,
    serviceType: row.serviceType,
    vehicleType: row.vehicleType,
    paymentMode: row.paymentMode,
    pickupSlot: row.pickupSlot,
    notes: row.notes ?? undefined,
    status: STATUS_MAP[row.status],
    dispatch: row.dispatch
        ? {
            driverId: row.dispatch.driverId,
            driverName: row.dispatch.driverName,
            driverPhone: row.dispatch.driverPhone,
            driverRating: row.dispatch.driverRating,
            acceptedAt: row.dispatch.acceptedAt,
            startedAt: row.dispatch.startedAt,
            completedAt: row.dispatch.completedAt,
        }
        : null,
    // The backend has no per-shipment "customer profile snapshot" endpoint —
    // callers needing customer contact info should use `sender`/`receiver`.
    userMeta: undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
});
