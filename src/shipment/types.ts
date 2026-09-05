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
    // Real backend fields (BackendDispatchInfo) that the mapper was
    // silently dropping — ShipmentChatScreen's "ORDER DISPATCHED" banner
    // and RatingScreen's "Completed in X mins" both need real timestamps,
    // not fabricated ones.
    acceptedAt?: string;
    startedAt?: string;
    completedAt?: string;
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

    // 'PARCEL' (default) | 'HOUSE_SHIFTING' — Porter-style movers booking.
    category: string;
    helpersCount: number;

    // Real handling-request flags — no fee attached (no payment system
    // exists to charge one through).
    fragile: boolean;
    insuranceRequested: boolean;

    // null until the driver uploads one (POST /shipments/:id/pod) —
    // ShipmentDetailsScreen's "Download POD" only fetches the real
    // image when this is set, rather than always trying and failing.
    podUploadedAt: string | null;

    // Not returned by kalanabhaBackend (no per-shipment customer snapshot
    // endpoint) — only ever populated when parsed straight from a Firestore
    // shipment doc via utils/parsers.ts::mapShipment.
    userMeta?: UserMeta;

    createdAt: string; // ISO (normalized)
    updatedAt: string;
}