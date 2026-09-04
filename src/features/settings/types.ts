// GET/POST/PUT /settings/vehicle-configs — Prisma `VehicleConfig` model.
export interface VehicleConfig {
    id: string;
    name: string;
    icon: string;
    // Real, admin-set illustration/photo — falls back to the Lucide icon
    // mapping (vehicleIconFor) until an admin sets one, never a fabricated
    // placeholder image.
    imageUrl?: string | null;
    maxWeight: number;
    maxLength: number;
    maxWidth: number;
    maxHeight: number;
    maxVolume: number;
    baseRate: number;
    ratePerKm: number;
    specialConditions: string[];
    active: boolean;
    color: string;
    updatedAt: string;
}

// POST/PUT /settings/vehicle-configs — VehicleConfigDto
export type VehicleConfigPayload = Omit<VehicleConfig, 'id' | 'updatedAt'>;

// GET /settings/service-areas — Prisma `ServiceArea` model, admin-managed
// (KalanabhaAdmin's Service Areas page). addOrders.tsx's pickup/drop
// picker lists these instead of free-text address entry.
export interface ServiceArea {
    id: string;
    name: string;
    city: string;
    pincode: string;
    lat: number;
    lng: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

// GET /settings/business — Prisma `BusinessSetting` model.
export interface BusinessSetting {
    key: string;
    value: string;
    description: string;
    updatedAt: string;
}
