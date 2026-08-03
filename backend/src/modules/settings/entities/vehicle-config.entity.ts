export interface VehicleConfigEntity {
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
  updatedAt: Date;
}
