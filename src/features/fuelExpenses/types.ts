
export type FuelExpenseCategory = 'FUEL' | 'TOLL';

export interface FuelExpense {
    id: string;
    driverId: string;
    category: FuelExpenseCategory;
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
    category?: FuelExpenseCategory;
    stationName: string;
    lat: number;
    lng: number;
    amount: number;
    litres?: number;
    shipmentId?: string;
        receiptUri?: string;
}
