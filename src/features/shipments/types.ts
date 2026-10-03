




export type BackendShipmentStatus = 'SCHEDULED' | 'SEARCHING' | 'ACCEPTED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'FAILED';

export interface BackendDispatchInfo {
    driverId: string;
    driverName: string;
    driverPhone?: string;
    driverRating?: number;
    acceptedAt?: string;
    startedAt?: string;
    completedAt?: string;
    assignedByAdmin?: boolean;
    assignedAt?: string;
    autoMatched?: boolean;
}

export interface BackendPersonInfo {
    name?: string;
    phone?: string;
    address: string;
    city?: string;
    lat?: number;
    lng?: number;
}

export interface BackendPackageInfo {
    category?: string;
    weight?: number;
}


export interface BackendShipment {
    id: string;
    shipmentId: string;
    trackingId: string;

    customerId: string;
    driverId: string | null;

    goodsType: string;
    weightKg: number;

    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    dropAddress: string;
    dropLat: number;
    dropLng: number;

    price: number;
    distanceKm: number;

    from: string;
    to: string;

    sender: BackendPersonInfo;
    receiver: BackendPersonInfo;
    package: BackendPackageInfo;
    dispatch: BackendDispatchInfo | null;

    serviceType: string;
    vehicleType: string;
    paymentMode: string;
    pickupSlot: string;
    notes: string | null;
    deliveryInstructions: string | null;

    status: BackendShipmentStatus;

    
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

    
    
    
    stops?: ShipmentStop[];

    createdAt: string;
    updatedAt: string;
}


export interface CreateShipmentPayload {
    goodsType: string;
    weightKg: number;
    pickup: { address: string; lat: number; lng: number };
    drop: { address: string; lat: number; lng: number };
    sender: BackendPersonInfo;
    receiver: BackendPersonInfo;
    package?: BackendPackageInfo;
    serviceType: string;
    vehicleType: string;
    paymentMode: string;
    pickupSlot: string;
    notes?: string;
    
    
    category?: string;
    helpersCount?: number;
    
    
    fragile?: boolean;
    insuranceRequested?: boolean;
    
    
    promoCode?: string;
    
    scheduledAt?: string;
    
    
    deliveryInstructions?: string;
    
    
    
    stops?: ShipmentStopInput[];
}

export interface ShipmentStopInput {
    address: string;
    lat: number;
    lng: number;
    contactName?: string;
    contactPhone?: string;
    notes?: string;
}

export type ShipmentStopStatus = 'PENDING' | 'ARRIVED' | 'COMPLETED';


export interface ShipmentStop {
    id: string;
    sequence: number;
    address: string;
    lat: number;
    lng: number;
    contactName: string | null;
    contactPhone: string | null;
    notes: string | null;
    status: ShipmentStopStatus;
    completedAt: string | null;
}


export interface QuoteShipmentPayload {
    pickup: { lat: number; lng: number };
    drop: { lat: number; lng: number };
    vehicleType: string;
    serviceType: string;
    category?: string;
    helpersCount?: number;
    insuranceRequested?: boolean;
}

export interface ShipmentQuote {
    price: number;
    distanceKm: number;
    helperCost: number;
    
    
    serviceSurcharge: number;
    
    
    
    insurancePremium: number;
}


export interface InsuranceClaim {
    id: string;
    shipmentId: string;
    customerId: string;
    description: string;
    photoFileKey: string | null;
    photoMimeType: string | null;
    status: 'OPEN' | 'APPROVED' | 'REJECTED' | 'PAID';
    payoutAmount: number | null;
    adminNote: string | null;
    resolvedAt: string | null;
    createdAt: string;
}




export interface DeliveryDispute {
    id: string;
    shipmentId: string;
    customerId: string;
    category: 'WRONG_ITEM' | 'MISSING_ITEM' | 'OVERCHARGED' | 'OTHER';
    description: string;
    photoFileKey: string | null;
    status: 'OPEN' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
    refundAmount: number | null;
    adminNote: string | null;
    resolvedAt: string | null;
    createdAt: string;
}


export interface AssignShipmentPayload {
    driverId: string;
}








export interface DriverEarningsWindow {
    total: number;
    trips: number;
}

export interface DriverEarningsSummary {
    today: DriverEarningsWindow;
    week: DriverEarningsWindow;
    allTime: DriverEarningsWindow;
    recentTrips: { id: string; trackingId: string; price: number; updatedAt: string; from: string; to: string }[];
}

export interface ShipmentStatusHistoryEntry {
    id: string;
    shipmentId: string;
    status: string;
    actorId: string | null;
    reason: string | null;
    createdAt: string;
}
