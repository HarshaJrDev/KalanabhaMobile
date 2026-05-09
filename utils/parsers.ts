import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Shipment } from '../shipment/types';


export const safeNumber = (val: unknown, fallback = 0): number => {
    if (typeof val === 'number' && !Number.isNaN(val)) return val;
    if (typeof val === 'string') {
        const parsed = Number(val);
        return Number.isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
};

const parseDate = (value: unknown): string => {
    if (!value) return new Date().toISOString();

    if (value instanceof firestore.Timestamp) {
        return value.toDate().toISOString();
    }

    if (typeof value === 'string') return value;

    return new Date().toISOString();
};

export const mapShipment = (
    doc: FirebaseFirestoreTypes.QueryDocumentSnapshot
): Shipment => {
    const data = doc.data();

    return {
        id: doc.id,
        shipmentId: data.shipmentId ?? doc.id,

        userId: data.userId ?? '',
        trackingId: data.trackingId ?? '',

        goodsType: data.goodsType ?? 'General',
        weightKg: safeNumber(data.weightKg),

        pickup: {
            address: data.pickup?.address ?? data.from ?? 'Unknown',
            lat: safeNumber(data.pickup?.lat),
            lng: safeNumber(data.pickup?.lng),
        },

        drop: {
            address: data.drop?.address ?? data.to ?? 'Unknown',
            lat: safeNumber(data.drop?.lat),
            lng: safeNumber(data.drop?.lng),
        },

        price: safeNumber(data.price),
        distanceKm: safeNumber(data.distanceKm),

        sender: data.sender ?? {},
        receiver: data.receiver ?? {},
        package: data.package ?? {},

        from: data.from ?? '',
        to: data.to ?? '',

        serviceType: data.serviceType ?? '',
        vehicleType: data.vehicleType ?? '',
        paymentMode: data.paymentMode ?? '',
        pickupSlot: data.pickupSlot ?? '',
        notes: data.notes,

        status: data.status ?? 'searching',
        dispatch: data.dispatch ?? null,

        userMeta: data.userMeta ?? {},

        createdAt: parseDate(data.createdAt),
        updatedAt: parseDate(data.updatedAt),
    };
};