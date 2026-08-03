export interface ShipmentStatusTransition {
  from: string;
  to: string;
  allowedRoles: string[];
}
