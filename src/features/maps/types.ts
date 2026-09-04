// GET /maps/fuel-stations response row — kalanabhaBackend
// src/modules/maps/services/maps.service.ts's FuelStation.
export interface FuelStation {
    id: string;
    name: string;
    lat: number;
    lng: number;
    distanceKm: number;
    brand?: string;
}
