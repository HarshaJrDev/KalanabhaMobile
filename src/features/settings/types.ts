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
