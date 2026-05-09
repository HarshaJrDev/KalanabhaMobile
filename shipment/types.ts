export type ShipmentStatus =
    | 'searching'
    | 'accepted'
    | 'in_transit'
    | 'delivered'
    | 'cancelled';

export interface LatLng {
    address: string;
    lat: number;
    lng: number;
}

export interface UserMeta {
    uid: string;
    email: string | null;
    phoneNumber: string | null;
    displayName: string | null;
}

export interface DispatchInfo {
    driverId: string;
    driverName: string;
    driverPhone?: string;
    driverRating?: number;
}

export interface PackageInfo {
    category?: string;
    weight?: number;
    price?: number;
    distanceKm?: number;
}

export interface PersonInfo {
    name?: string;
    phone?: string;
    address: string;
    city?: string;
    lat?: number;
    lng?: number;
}

export interface Shipment {
    id: string;
    shipmentId: string;

    userId: string;
    trackingId: string;

    goodsType: string;
    weightKg: number;

    pickup: LatLng;
    drop: LatLng;

    price: number;
    distanceKm: number;

    sender: PersonInfo;
    receiver: PersonInfo;
    package: PackageInfo;

    from: string;
    to: string;

    serviceType: string;
    vehicleType: string;
    paymentMode: string;
    pickupSlot: string;
    notes?: string;

    status: ShipmentStatus;
    dispatch: DispatchInfo | null;

    userMeta: UserMeta;

    createdAt: string; // ISO (normalized)
    updatedAt: string;
}