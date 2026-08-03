export class ShipmentStatusChangedEvent {
  constructor(
    public readonly shipmentId: string,
    public readonly previousStatus: string,
    public readonly nextStatus: string,
  ) {}
}
