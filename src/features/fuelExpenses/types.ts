
export interface FuelExpense {
    id: string;
    driverId: string;
    shipmentId: string | null;
    stationName: string;
    lat: number;
    lng: number;
    litres: number | null;
    amount: number;
    
    
    
    hasReceipt: boolean;
    createdAt: string;
}

export interface CreateFuelExpenseInput {
    stationName: string;
    lat: number;
    lng: number;
    amount: number;
    litres?: number;
    shipmentId?: string;
        receiptUri?: string;
}
