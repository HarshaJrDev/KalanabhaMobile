import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

// Excludes passwordHash from every read/write result returned to callers —
// this repository is used to serve API responses (GET /users/me, driver
// lists, etc.), unlike AuthRepository which legitimately needs the hash
// for bcrypt.compare during login.
const SAFE_USER_SELECT = {
  id: true,
  email: true,
  role: true,
  displayName: true,
  phone: true,
  address: true,
  customerType: true,
  isOnline: true,
  fcmToken: true,
  vehicleType: true,
  licenseNumber: true,
  rating: true,
  totalDeliveries: true,
  documentsVerified: true,
  createdByAdmin: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: SAFE_USER_SELECT });
  }

  updateFcmToken(id: string, fcmToken: string) {
    return this.prisma.user.update({ where: { id }, data: { fcmToken }, select: SAFE_USER_SELECT });
  }

  setOnlineStatus(id: string, isOnline: boolean) {
    return this.prisma.user.update({ where: { id }, data: { isOnline }, select: SAFE_USER_SELECT });
  }

  findDrivers() {
    return this.prisma.user.findMany({
      where: { role: 'DRIVER' },
      orderBy: { createdAt: 'desc' },
      select: SAFE_USER_SELECT,
    });
  }

  findOnlineDrivers() {
    return this.prisma.user.findMany({ where: { role: 'DRIVER', isOnline: true }, select: SAFE_USER_SELECT });
  }

  // Candidates for auto-match: online, right vehicle type, and has reported
  // a location recently enough to trust (see TrackingModule). Busy-driver
  // filtering happens in DispatchService, which also owns the shipment table.
  findOnlineDriversForMatching(vehicleType: string) {
    return this.prisma.user.findMany({
      where: {
        role: 'DRIVER',
        isOnline: true,
        vehicleType: { equals: vehicleType, mode: 'insensitive' },
        lastLat: { not: null },
        lastLng: { not: null },
      },
      select: { id: true, displayName: true, phone: true, rating: true, lastLat: true, lastLng: true },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  createDriver(params: {
    email: string;
    passwordHash: string;
    displayName: string;
    phone?: string;
    vehicleType: string;
    licenseNumber?: string;
    rating: number;
  }) {
    return this.prisma.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        role: 'DRIVER',
        displayName: params.displayName,
        phone: params.phone,
        vehicleType: params.vehicleType,
        licenseNumber: params.licenseNumber,
        rating: params.rating,
        isOnline: false,
        totalDeliveries: 0,
        documentsVerified: false,
        createdByAdmin: true,
      },
      select: SAFE_USER_SELECT,
    });
  }

  setDocumentsVerified(id: string, verified: boolean) {
    return this.prisma.user.update({ where: { id }, data: { documentsVerified: verified }, select: SAFE_USER_SELECT });
  }

  incrementTotalDeliveries(id: string) {
    return this.prisma.user.update({ where: { id }, data: { totalDeliveries: { increment: 1 } }, select: SAFE_USER_SELECT });
  }
}
