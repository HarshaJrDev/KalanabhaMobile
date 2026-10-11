

export interface FuelStation {
    id: string;
    name: string;
    lat: number;
    lng: number;
    distanceKm: number;
    brand?: string;
}

export interface TollGate {
    id: string;
    name: string;
    lat: number;
    lng: number;
    distanceKm: number;
    operator?: string;
}
