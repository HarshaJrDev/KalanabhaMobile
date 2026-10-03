import { apiClient } from '@api/client';
import type { ApiSuccessResponse, PaginatedResult } from '@api/types';
import type {
    AssignShipmentPayload,
    BackendShipment,
    CreateShipmentPayload,
    DriverEarningsSummary,
    InsuranceClaim,
    QuoteShipmentPayload,
    ShipmentQuote,
    ShipmentStatusHistoryEntry,
} from '../types';







export const createShipment = async (
    payload: CreateShipmentPayload,
    idempotencyKey?: string,
): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>('/shipments', payload, {
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    });
    return data.data;
};

export const quoteShipment = async (payload: QuoteShipmentPayload): Promise<ShipmentQuote> => {
    const { data } = await apiClient.post<ApiSuccessResponse<ShipmentQuote>>('/shipments/quote', payload);
    return data.data;
};


export const getMyShipments = async (): Promise<BackendShipment[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<BackendShipment[]>>('/shipments/mine');
    return data.data;
};





export const getMyShipmentHistory = async (): Promise<BackendShipment[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<BackendShipment[]>>('/shipments/mine/history');
    return data.data;
};


export const getSearchingShipments = async (): Promise<BackendShipment[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<BackendShipment[]>>('/shipments/searching');
    return data.data;
};





export const getMyShipmentsAsDriver = async (): Promise<BackendShipment[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<BackendShipment[]>>('/shipments/driver/mine');
    return data.data;
};




export const getDriverEarningsSummary = async (): Promise<DriverEarningsSummary> => {
    const { data } = await apiClient.get<ApiSuccessResponse<DriverEarningsSummary>>('/shipments/driver/earnings-summary');
    return data.data;
};




export const getAllShipmentsForAdmin = async (
    page = 1,
    limit = 100,
): Promise<PaginatedResult<BackendShipment>> => {
    const { data } = await apiClient.get<ApiSuccessResponse<PaginatedResult<BackendShipment>>>(
        '/shipments/admin',
        { params: { page, limit } },
    );
    return data.data;
};

export const getShipmentById = async (id: string): Promise<BackendShipment> => {
    const { data } = await apiClient.get<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}`);
    return data.data;
};






export const getShipmentHistory = async (id: string): Promise<ShipmentStatusHistoryEntry[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<ShipmentStatusHistoryEntry[]>>(`/shipments/${id}/history`);
    return data.data;
};


export const acceptShipment = async (id: string): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/accept`);
    return data.data;
};


export const assignShipment = async (id: string, payload: AssignShipmentPayload): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/assign`, payload);
    return data.data;
};





export const arriveAtShipment = async (id: string, latitude: number, longitude: number): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/arrive`, { latitude, longitude });
    return data.data;
};




export const startDelivery = async (id: string, otp: string): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/start`, { otp });
    return data.data;
};


export const uploadPickupProof = async (id: string, fileUri: string, fileName: string, mimeType: string): Promise<BackendShipment> => {
    const form = new FormData();
    form.append('file', { uri: fileUri, name: fileName, type: mimeType } as any);
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/pickup-proof`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
};



export const completeDelivery = async (id: string, otp: string): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/complete`, { otp });
    return data.data;
};






export const verifyDeliveryOtp = async (id: string, otp: string): Promise<{ verified: boolean }> => {
    const { data } = await apiClient.post<ApiSuccessResponse<{ verified: boolean }>>(`/shipments/${id}/delivery/verify-otp`, { otp });
    return data.data;
};



export const saveDeliverySignature = async (id: string, strokes: { x: number; y: number }[][]): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/signature`, { strokes });
    return data.data;
};



export const cancelShipment = async (id: string, reason?: string): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/cancel`, { reason });
    return data.data;
};





export const driverCancelShipment = async (id: string, reason?: string): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/driver-cancel`, { reason });
    return data.data;
};



export const rescheduleShipment = async (id: string, scheduledAt: string): Promise<BackendShipment> => {
    const { data } = await apiClient.patch<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/schedule`, { scheduledAt });
    return data.data;
};




export const completeShipmentStop = async (shipmentId: string, stopId: string): Promise<BackendShipment> => {
    const { data } = await apiClient.patch<ApiSuccessResponse<BackendShipment>>(`/shipments/${shipmentId}/stops/${stopId}/complete`);
    return data.data;
};




export const uploadShipmentPod = async (id: string, fileUri: string, fileName: string, mimeType: string): Promise<BackendShipment> => {
    const form = new FormData();
    form.append('file', { uri: fileUri, name: fileName, type: mimeType } as any);

    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/pod`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
};





export const fileInsuranceClaim = async (
    shipmentId: string,
    description: string,
    photo?: { uri: string; name: string; type: string },
): Promise<InsuranceClaim> => {
    const form = new FormData();
    form.append('description', description);
    if (photo) {
        form.append('photo', { uri: photo.uri, name: photo.name, type: photo.type } as any);
    }
    const { data } = await apiClient.post<ApiSuccessResponse<InsuranceClaim>>(
        `/shipments/${shipmentId}/insurance-claim`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
};

export const getInsuranceClaim = async (shipmentId: string): Promise<InsuranceClaim | null> => {
    const { data } = await apiClient.get<ApiSuccessResponse<InsuranceClaim | null>>(`/shipments/${shipmentId}/insurance-claim`);
    return data.data;
};
