// GET/POST/PUT /settings/vehicle-configs — Prisma `VehicleConfig` model.
export interface VehicleConfig {
    id: string;
    name: string;
    icon: string;
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
