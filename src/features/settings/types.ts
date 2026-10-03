
export interface VehicleConfig {
    id: string;
    name: string;
    icon: string;
    
    
    
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


export type VehicleConfigPayload = Omit<VehicleConfig, 'id' | 'updatedAt'>;




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




export interface PackageCategory {
    id: string;
    name: string;
    icon: string;
    sortOrder: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}


export interface BusinessSetting {
    key: string;
    value: string;
    description: string;
    updatedAt: string;
}
