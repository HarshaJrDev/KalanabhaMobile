export class ShipmentAssignedEvent {
  constructor(
    public readonly shipmentId: string,
    public readonly trackingId: string,
    public readonly driverId: string,
  ) {}
}
