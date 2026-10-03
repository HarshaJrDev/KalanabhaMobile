import { acceptShipment as acceptShipmentRequest } from '@features/shipments/api/shipments.api';

export const acceptShipment = async ({ shipmentId }: { shipmentId: string }): Promise<void> => {
    await acceptShipmentRequest(shipmentId);
};

export const autoMatchShipment = async (_params: {
    shipmentId: string;
    trackingId: string;
    pickup: { lat: number; lng: number };
    vehicleType: string;
}): Promise<boolean> => {
    return false;
};
