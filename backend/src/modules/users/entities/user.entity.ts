export interface UserEntity {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'DRIVER' | 'ADMIN' | 'DISPATCHER' | 'WAREHOUSE';
  displayName: string | null;
  phone: string | null;
  address: string | null;
  customerType: string | null;
  isOnline: boolean;
  fcmToken: string | null;
  vehicleType: string | null;
  licenseNumber: string | null;
  rating: number | null;
  totalDeliveries: number;
  documentsVerified: boolean;
  createdByAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}
