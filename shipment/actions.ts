import firestore from '@react-native-firebase/firestore';
import { haversineDistanceKm } from '../utils/geo';

const MAX_MATCH_RADIUS_KM = 15;

// Rapido-style auto-match: right after a shipment is created, try to
// silently assign the nearest available online driver of the right vehicle
// type, instead of making the customer wait for someone to browse the
// "searching" pool. Same accept-transaction pattern as acceptShipment below
// — if no suitable driver is found, this is a no-op and the shipment stays
// `searching` for the normal manual-accept flow.
export const autoMatchShipment = async ({
    shipmentId,
    trackingId,
    pickup,
    vehicleType,
}: {
    shipmentId: string;
    trackingId: string;
    pickup: { lat: number; lng: number };
    vehicleType: string;
}): Promise<boolean> => {
    const driversSnap = await firestore()
        .collection('users')
        .where('role', '==', 'driver')
        .where('isOnline', '==', true)
        .where('vehicleType', '==', vehicleType)
        .get();

    const candidates = driversSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(d => typeof d.lastLat === 'number' && typeof d.lastLng === 'number');

    if (candidates.length === 0) return false;

    // Exclude drivers already on an active delivery.
    const candidateIds = candidates.slice(0, 10).map(c => c.id);
    const busySnap = await firestore()
        .collection('shipments')
        .where('dispatch.driverId', 'in', candidateIds)
        .get();

    const busyIds = new Set(
        busySnap.docs
            .map(d => d.data())
            .filter(s => s.status === 'accepted' || s.status === 'in_transit')
            .map(s => s.dispatch?.driverId)
    );

    const available = candidates.filter(c => !busyIds.has(c.id));
    if (available.length === 0) return false;

    let nearest = available[0];
    let nearestDistanceKm = haversineDistanceKm(pickup, { lat: nearest.lastLat, lng: nearest.lastLng });
    for (const candidate of available.slice(1)) {
        const distanceKm = haversineDistanceKm(pickup, { lat: candidate.lastLat, lng: candidate.lastLng });
        if (distanceKm < nearestDistanceKm) {
            nearest = candidate;
            nearestDistanceKm = distanceKm;
        }
    }

    if (nearestDistanceKm > MAX_MATCH_RADIUS_KM) return false;

    const ref = firestore().collection('shipments').doc(shipmentId);
    let matched = false;

    await firestore().runTransaction(async tx => {
        const doc = await tx.get(ref);
        if (!doc.exists || doc.data()?.status !== 'searching') return;

        tx.update(ref, {
            status: 'accepted',
            dispatch: {
                driverId: nearest.id,
                driverName: nearest.displayName ?? 'Driver',
                driverPhone: nearest.phone,
                driverRating: nearest.rating,
                autoMatched: true,
                assignedAt: firestore.FieldValue.serverTimestamp(),
            },
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        matched = true;
    });

    if (matched) {
        await firestore().collection('notifications').add({
            userId: nearest.id,
            type: 'ORDER_ASSIGNED',
            shipmentId,
            title: 'New Delivery Assigned',
            body: `Order ${trackingId} assigned to you`,
            read: false,
            createdAt: firestore.FieldValue.serverTimestamp(),
        });
    }

    return matched;
};

export const acceptShipment = async ({
    shipmentId,
    driver,
}: {
    shipmentId: string;
    driver: {
        id: string;
        name: string;
        phone?: string;
        rating?: number;
    };
}): Promise<void> => {
    const ref = firestore().collection('shipments').doc(shipmentId);

    await firestore().runTransaction(async (tx) => {
        const doc = await tx.get(ref);

        if (!doc.exists) {
            throw new Error('Shipment not found');
        }

        const data = doc.data();

        if (data?.status !== 'searching') {
            throw new Error('Already taken');
        }

        tx.update(ref, {
            status: 'accepted',
            dispatch: {
                driverId: driver.id,
                driverName: driver.name,
                driverPhone: driver.phone,
                driverRating: driver.rating,
            },
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    });
};