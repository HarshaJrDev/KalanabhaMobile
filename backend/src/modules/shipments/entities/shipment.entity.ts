// Field shape kept 1:1 with the mobile app's shipment/types.ts
// so the API contract needs no client-side remapping.

export type ShipmentStatus =
  | 'searching'
  | 'accepted'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface LatLng {
  address: string;
  lat: number;
  lng: number;
}

export interface PersonInfo {
  name?: string;
  phone?: string;
  address: string;
  city?: string;
  lat?: number;
  lng?: number;
}

export interface PackageInfo {
  category?: string;
  weight?: number;
  price?: number;
  distanceKm?: number;
}

export interface DispatchInfo {
  driverId: string;
  driverName: string;
  driverPhone?: string;
  driverRating?: number;
}

export interface ShipmentEntity {
  id: string;
  shipmentId: string;
  trackingId: string;

  userId: string;
  goodsType: string;
  weightKg: number;

  pickup: LatLng;
  drop: LatLng;

  price: number;
  distanceKm: number;

  sender: PersonInfo;
  receiver: PersonInfo;
  package: PackageInfo;

  serviceType: string;
  vehicleType: string;
  paymentMode: string;
  pickupSlot: string;
  notes?: string;

  status: ShipmentStatus;
  dispatch: DispatchInfo | null;

  createdAt: Date;
  updatedAt: Date;
}
