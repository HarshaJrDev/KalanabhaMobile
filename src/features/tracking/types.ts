// GET /shipments/:id/location and TrackingGateway 'location' event payload.
export interface DriverLocation {
    lat: number;
    lng: number;
    updatedAt: string;
}
