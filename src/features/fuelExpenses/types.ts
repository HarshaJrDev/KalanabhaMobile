// kalanabhaBackend DriverFuelExpense — /fuel-expenses response row.
export interface FuelExpense {
    id: string;
    driverId: string;
    shipmentId: string | null;
    stationName: string;
    lat: number;
    lng: number;
    litres: number | null;
    amount: number;
    receiptFileKey: string | null;
    createdAt: string;
}

export interface CreateFuelExpenseInput {
    stationName: string;
    lat: number;
    lng: number;
    amount: number;
    litres?: number;
    shipmentId?: string;
    /** file:// URI from the device picker/camera — sent as multipart, matching driver-documents' upload pattern. */
    receiptUri?: string;
}
