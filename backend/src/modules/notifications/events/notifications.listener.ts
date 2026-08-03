import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../services/notifications.service';
import { ShipmentAssignedEvent } from '../../shipments/events/shipment-assigned.event';

// Mirrors admin App.tsx's AssignModal, which writes a notification doc
// right after assigning a driver. Kept as an event listener (rather than
// ShipmentsModule calling NotificationsService directly) per the
// "domain events over direct coupling" convention in docs/architecture/overview.md.
@Injectable()
export class NotificationsListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('shipment.assigned')
  async handleShipmentAssigned(event: ShipmentAssignedEvent) {
    await this.notificationsService.create({
      userId: event.driverId,
      type: 'ORDER_ASSIGNED',
      shipmentId: event.shipmentId,
      title: 'New Delivery Assigned',
      body: `Order ${event.trackingId} assigned to you`,
    });
  }
}
