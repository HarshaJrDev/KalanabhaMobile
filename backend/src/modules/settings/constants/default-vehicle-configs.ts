import { VehicleConfigDto } from '../dto/vehicle-config.dto';

// Mirrors admin App.tsx's DEFAULT_VEHICLES, seeded client-side the first
// time the `vehicleConfigs` collection was empty. Seeded server-side now,
// once, at application bootstrap (SettingsService.onModuleInit).
export const DEFAULT_VEHICLE_CONFIGS: VehicleConfigDto[] = [
  { name: 'Bike', icon: '🏍️', maxWeight: 20, maxLength: 60, maxWidth: 40, maxHeight: 40, maxVolume: 30, baseRate: 49, ratePerKm: 5, specialConditions: ['fragile', 'documents'], active: true, color: '#4F8EF7' },
  { name: 'Van', icon: '🚐', maxWeight: 500, maxLength: 200, maxWidth: 150, maxHeight: 150, maxVolume: 4500, baseRate: 299, ratePerKm: 12, specialConditions: ['fragile', 'refrigerated', 'bulk'], active: true, color: '#34D399' },
  { name: 'Truck', icon: '🚛', maxWeight: 5000, maxLength: 400, maxWidth: 240, maxHeight: 240, maxVolume: 40000, baseRate: 999, ratePerKm: 20, specialConditions: ['heavy', 'oversized', 'industrial', 'refrigerated'], active: true, color: '#FBBF24' },
];
