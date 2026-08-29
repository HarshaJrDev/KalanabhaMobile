// Backend's actual wire shape — kalanabhaBackend returns the raw Prisma
// `Shipment` row (flat pickup*/drop* columns, UPPERCASE status), NOT the
// nested shape described in shipments/entities/shipment.entity.ts (that
// file documents intent; nothing in the backend maps rows into it before
// sending the response). Verified against a running instance.
export type BackendShipmentStatus = 'SEARCHING' | 'ACCEPTED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

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

// GET/POST /shipments* response row
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

    status: BackendShipmentStatus;

    createdAt: string;
    updatedAt: string;
}

// POST /shipments — CreateShipmentDto
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
}

// POST /shipments/quote — QuoteShipmentDto / response
export interface QuoteShipmentPayload {
    pickup: { lat: number; lng: number };
    drop: { lat: number; lng: number };
    vehicleType: string;
    serviceType: string;
}

export interface ShipmentQuote {
    price: number;
    distanceKm: number;
}

// POST /shipments/:id/assign — AssignShipmentDto
export interface AssignShipmentPayload {
    driverId: string;
}
