import { apiClient } from '../../../src/api/client';
import type { ApiSuccessResponse } from '../../../src/api/types';
import type {
    AssignShipmentPayload,
    BackendShipment,
    CreateShipmentPayload,
    QuoteShipmentPayload,
    ShipmentQuote,
} from '../types';

// One-to-one with kalanabhaBackend/src/modules/shipments/controllers/shipments.controller.ts

export const createShipment = async (payload: CreateShipmentPayload): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>('/shipments', payload);
    return data.data;
};

export const quoteShipment = async (payload: QuoteShipmentPayload): Promise<ShipmentQuote> => {
    const { data } = await apiClient.post<ApiSuccessResponse<ShipmentQuote>>('/shipments/quote', payload);
    return data.data;
};

// Active (SEARCHING/ACCEPTED/IN_TRANSIT) shipments for the logged-in customer.
export const getMyShipments = async (): Promise<BackendShipment[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<BackendShipment[]>>('/shipments/mine');
    return data.data;
};

// Pool of unassigned shipments — driver app's "available orders" list.
export const getSearchingShipments = async (): Promise<BackendShipment[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<BackendShipment[]>>('/shipments/searching');
    return data.data;
};

// admin/dispatcher only
export const getAllShipmentsForAdmin = async (): Promise<BackendShipment[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<BackendShipment[]>>('/shipments/admin');
    return data.data;
};

export const getShipmentById = async (id: string): Promise<BackendShipment> => {
    const { data } = await apiClient.get<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}`);
    return data.data;
};

// driver only
export const acceptShipment = async (id: string): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/accept`);
    return data.data;
};

// admin/dispatcher only
export const assignShipment = async (id: string, payload: AssignShipmentPayload): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/assign`, payload);
    return data.data;
};

// driver only
export const startDelivery = async (id: string): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/start`);
    return data.data;
};

// driver only
export const completeDelivery = async (id: string): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/complete`);
    return data.data;
};

// customer (owner) or admin/dispatcher
export const cancelShipment = async (id: string): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/cancel`);
    return data.data;
};
