import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { CreateFuelExpenseInput, FuelExpense } from '../types';

// One-to-one with kalanabhaBackend/src/modules/fuel-expenses/controllers/fuel-expenses.controller.ts

export const createFuelExpense = async (input: CreateFuelExpenseInput): Promise<FuelExpense> => {
    const form = new FormData();
    form.append('stationName', input.stationName);
    form.append('lat', String(input.lat));
    form.append('lng', String(input.lng));
    form.append('amount', String(input.amount));
    if (input.litres != null) form.append('litres', String(input.litres));
    if (input.shipmentId) form.append('shipmentId', input.shipmentId);
    if (input.receiptUri) {
        // Same multipart-file shape React Native's fetch/axios expects —
        // no separate image-picker dependency added here; the caller
        // supplies whatever URI it already has (camera or gallery).
        form.append('receipt', { uri: input.receiptUri, name: 'receipt.jpg', type: 'image/jpeg' } as any);
    }

    const { data } = await apiClient.post<ApiSuccessResponse<FuelExpense>>('/fuel-expenses', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
};

export const getMyFuelExpenses = async (): Promise<FuelExpense[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<FuelExpense[]>>('/fuel-expenses/mine');
    return data.data;
};
