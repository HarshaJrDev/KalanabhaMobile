import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';
import { UsersService } from '../../users/services/users.service';
import { ShipmentAssignedEvent } from '../events/shipment-assigned.event';

// Server-side equivalent of the mobile app's shipment/actions.ts /
// components/LogisticsCardList.tsx::onAccept, which ran a Firestore
// transaction on the client. Moving it here means a driver can no longer
// race or spoof the accept — the DB row itself is the lock via the atomic
// `status: SEARCHING` guard in the WHERE clause.
@Injectable()
export class DispatchService {
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
