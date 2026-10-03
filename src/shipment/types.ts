export type ShipmentStatus =
    | 'scheduled'
    | 'searching'
    | 'accepted'
    | 'in_transit'
    | 'delivered'
    | 'cancelled'
    | 'failed';

export interface LatLng {
    address: string;
    lat: number;
    lng: number;
}

export interface ShipmentStopEntry {
    id: string;
    sequence: number;
    address: string;
    lat: number;
    lng: number;
    contactName: string | null;
    contactPhone: string | null;
    notes: string | null;
    status: 'PENDING' | 'ARRIVED' | 'COMPLETED';
    completedAt: string | null;
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
    deliveryInstructions?: string[];

    status: ShipmentStatus;
    dispatch: DispatchInfo | null;

    
    category: string;
    helpersCount: number;

    
    
    fragile: boolean;
    insuranceRequested: boolean;

    
    
    
    podUploadedAt: string | null;

    
    
    
    deliveryOtp: string | null;

    
    
    
    pickupOtp: string | null;

    
    
    pickupProofUploadedAt: string | null;

    
    
    arrivalState: 'NONE' | 'EN_ROUTE_TO_PICKUP' | 'ARRIVED_AT_PICKUP' | 'EN_ROUTE_TO_DROP' | 'ARRIVED_AT_DROP';
    pickupArrivedAt: string | null;
    dropArrivedAt: string | null;

    
    
    deliverySignatureCapturedAt: string | null;

    
    
    
    expiresAt: string | null;

    
    
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

    
    promoCode: string | null;
    promoDiscount: number | null;

    
    scheduledAt: string | null;

    
    
    stops?: ShipmentStopEntry[];

    
    
    
    userMeta?: UserMeta;

    createdAt: string; 
    updatedAt: string;
}