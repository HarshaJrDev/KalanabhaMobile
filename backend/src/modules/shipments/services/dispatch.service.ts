import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';
import { UsersService } from '../../users/services/users.service';
import { ShipmentAssignedEvent } from '../events/shipment-assigned.event';
import { haversineDistanceKm, LatLng } from '../../../utils/geo.util';

// Server-side equivalent of the mobile app's shipment/actions.ts /
// components/LogisticsCardList.tsx::onAccept, which ran a Firestore
// transaction on the client. Moving it here means a driver can no longer
// race or spoof the accept — the DB row itself is the lock via the atomic
// `status: SEARCHING` guard in the WHERE clause.
@Injectable()
export class DispatchService {
  // Rapido-style auto-match radius — beyond this, fall back to the manual
  // "searching" pool rather than assigning a driver who's too far away.
  private readonly MAX_MATCH_RADIUS_KM = 15;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async acceptShipment(shipmentId: string, driverId: string) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    const driver = await this.usersService.findById(driverId);

    const result = await this.prisma.shipment.updateMany({
      where: { id: shipmentId, status: 'SEARCHING' },
      data: {
        driverId,
        status: 'ACCEPTED',
        dispatch: {
          driverId,
          driverName: driver.displayName ?? 'Driver',
          driverPhone: driver.phone ?? undefined,
          driverRating: driver.rating ?? undefined,
          acceptedAt: new Date().toISOString(),
        } as any,
      },
    });

    if (result.count === 0) {
      throw new ConflictException('Already taken');
    }

    return this.prisma.shipment.findUnique({ where: { id: shipmentId } });
  }

  // Mirrors admin App.tsx's AssignModal — admin/dispatcher assigns a
  // specific online driver directly, bypassing the "searching" pool.
  async assignShipment(shipmentId: string, driverId: string) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    const driver = await this.usersService.findById(driverId);

    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        driverId,
        status: 'ACCEPTED',
        dispatch: {
          driverId,
          driverName: driver.displayName ?? 'Driver',
          assignedByAdmin: true,
          assignedAt: new Date().toISOString(),
        } as any,
      },
    });

    this.eventEmitter.emit(
      'shipment.assigned',
      new ShipmentAssignedEvent(updated.id, updated.trackingId, driverId),
    );

    return updated;
  }

  async startDelivery(shipmentId: string, driverId: string) {
    const shipment = await this.getOwnedByDriver(shipmentId, driverId);

    const result = await this.prisma.shipment.updateMany({
      where: { id: shipmentId, status: 'ACCEPTED' },
      data: { status: 'IN_TRANSIT', dispatch: { ...(shipment.dispatch as any), startedAt: new Date().toISOString() } as any },
    });

    if (result.count === 0) {
      throw new ConflictException('Shipment is not in an acceptable state to start');
    }

    return this.prisma.shipment.findUnique({ where: { id: shipmentId } });
  }

  async completeDelivery(shipmentId: string, driverId: string) {
    const shipment = await this.getOwnedByDriver(shipmentId, driverId);

    const result = await this.prisma.shipment.updateMany({
      where: { id: shipmentId, status: 'IN_TRANSIT' },
      data: {
        status: 'DELIVERED',
        dispatch: { ...(shipment.dispatch as any), completedAt: new Date().toISOString() } as any,
      },
    });

    if (result.count === 0) {
      throw new ConflictException('Shipment is not in transit');
    }

    await this.usersService.findById(driverId); // ensures driver still exists
    await this.prisma.user.update({ where: { id: driverId }, data: { totalDeliveries: { increment: 1 } } });

    return this.prisma.shipment.findUnique({ where: { id: shipmentId } });
  }

  // Rapido-style auto-match: on a new shipment, try to silently assign the
  // nearest available online driver of the right vehicle type instead of
  // making them wait to be picked from the "searching" pool. Returns null
  // (and leaves the shipment in SEARCHING) if no suitable driver is found —
  // the manual accept flow is the fallback, not replaced by this.
  async autoMatch(shipmentId: string, pickup: LatLng, vehicleType: string) {
    const candidates = await this.usersService.findOnlineDriversForMatching(vehicleType);
    if (candidates.length === 0) {
      return null;
    }

    const busyDriverIds = await this.prisma.shipment.findMany({
      where: { driverId: { in: candidates.map((c) => c.id) }, status: { in: ['ACCEPTED', 'IN_TRANSIT'] } },
      select: { driverId: true },
    });
    const busySet = new Set(busyDriverIds.map((b) => b.driverId));
    const available = candidates.filter((c) => !busySet.has(c.id));
    if (available.length === 0) {
      return null;
    }

    let nearest = available[0];
    let nearestDistanceKm = haversineDistanceKm(pickup, { lat: nearest.lastLat!, lng: nearest.lastLng! });
    for (const candidate of available.slice(1)) {
      const distanceKm = haversineDistanceKm(pickup, { lat: candidate.lastLat!, lng: candidate.lastLng! });
      if (distanceKm < nearestDistanceKm) {
        nearest = candidate;
        nearestDistanceKm = distanceKm;
      }
    }

    if (nearestDistanceKm > this.MAX_MATCH_RADIUS_KM) {
      return null;
    }

    return this.autoAssignShipment(shipmentId, nearest.id);
  }

  private async autoAssignShipment(shipmentId: string, driverId: string) {
    const driver = await this.usersService.findById(driverId);

    const result = await this.prisma.shipment.updateMany({
      where: { id: shipmentId, status: 'SEARCHING' },
      data: {
        driverId,
        status: 'ACCEPTED',
        dispatch: {
          driverId,
          driverName: driver.displayName ?? 'Driver',
          driverPhone: driver.phone ?? undefined,
          driverRating: driver.rating ?? undefined,
          autoMatched: true,
          assignedAt: new Date().toISOString(),
        } as any,
      },
    });

    if (result.count === 0) {
      // Lost a race to a manual accept/admin assign between the candidate
      // search and this write — the shipment already has a driver, fine.
      return null;
    }

    const updated = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });

    this.eventEmitter.emit(
      'shipment.assigned',
      new ShipmentAssignedEvent(updated!.id, updated!.trackingId, driverId),
    );

    return updated;
  }

  private async getOwnedByDriver(shipmentId: string, driverId: string) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }
    if (shipment.driverId !== driverId) {
      throw new ConflictException('Shipment is not assigned to you');
    }
    return shipment;
  }
}
