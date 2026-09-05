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

    // 'PARCEL' (default) | 'HOUSE_SHIFTING' — Porter-style movers booking.
    category: string;
    helpersCount: number;

    // Real handling-request flags — no fee attached (no payment system
    // exists to charge one through).
    fragile: boolean;
    insuranceRequested: boolean;

    // null until the driver actually uploads one via POST
    // /shipments/:id/pod — ShipmentDetailsScreen.tsx uses this to know
    // whether "Download POD" has anything real to show.
    podUploadedAt: string | null;

    // Real 4-digit delivery OTP (kalanabhaBackend DispatchService,
    // generated on accept/admin-assign/auto-match) — null while SEARCHING,
    // required from the driver at POST /shipments/:id/complete. The
    // customer app shows this to the customer; the driver app never
    // renders it (the driver has to ask the customer for it).
    deliveryOtp: string | null;

    // Real, admin-set expiry (BusinessSetting
    // 'shipment_search_expiry_minutes') a SEARCHING shipment auto-cancels
    // at if no driver accepts it — set on creation, backing the driver
    // Home screen's real countdown on the incoming-request card.
    expiresAt: string | null;

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
    // 'PARCEL' (default, omit) | 'HOUSE_SHIFTING' — Porter-style movers
    // booking (StepCategory in addOrders.tsx).
    category?: string;
    helpersCount?: number;
    // Real handling-request flags — no fee attached (no payment system
    // exists to charge one through).
    fragile?: boolean;
    insuranceRequested?: boolean;
}

// POST /shipments/quote — QuoteShipmentDto / response
export interface QuoteShipmentPayload {
    pickup: { lat: number; lng: number };
    drop: { lat: number; lng: number };
    vehicleType: string;
    serviceType: string;
    category?: string;
    helpersCount?: number;
}

export interface ShipmentQuote {
    price: number;
    distanceKm: number;
    helperCost: number;
    // Real Express/Same Day surcharge PricingService.quote() now actually
    // adds (kalanabhaBackend 389a5bc) — 0 for Standard.
    serviceSurcharge: number;
}

// POST /shipments/:id/assign — AssignShipmentDto
export interface AssignShipmentPayload {
    driverId: string;
}

// GET /shipments/:id/history — Prisma ShipmentStatusHistory model, one row
// per real status transition. `status` is the backend's uppercase
// enum-as-string ('SEARCHING'/'ACCEPTED'/'IN_TRANSIT'/'DELIVERED'/
// 'CANCELLED'), not the lowercase ShipmentStatus this app displays
// elsewhere.
export interface ShipmentStatusHistoryEntry {
    id: string;
    shipmentId: string;
    status: string;
    actorId: string | null;
    reason: string | null;
    createdAt: string;
}
