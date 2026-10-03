import { apiClient } from '@api/client';
import type { ApiSuccessResponse, PaginatedResult } from '@api/types';
import type {
    AssignShipmentPayload,
    BackendShipment,
    CreateShipmentPayload,
    DriverEarningsSummary,
    DeliveryDispute,
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



export const completeDelivery = async (
    id: string,
    otp: string,
    packageCondition?: 'GOOD' | 'DAMAGED',
    deliveryNote?: string,
): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/complete`, {
        otp,
        packageCondition,
        deliveryNote,
    });
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






export const failDeliveryShipment = async (
    id: string,
    reason: 'CUSTOMER_UNREACHABLE' | 'WRONG_ADDRESS' | 'REFUSED' | 'OTHER',
    note?: string,
): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/fail-delivery`, { reason, note });
    return data.data;
};



export const retryDeliveryShipment = async (id: string): Promise<BackendShipment> => {
    const { data } = await apiClient.post<ApiSuccessResponse<BackendShipment>>(`/shipments/${id}/retry-delivery`);
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




export const fileDispute = async (
    shipmentId: string,
    category: 'WRONG_ITEM' | 'MISSING_ITEM' | 'OVERCHARGED' | 'OTHER',
    description: string,
    photo?: { uri: string; name: string; type: string },
): Promise<DeliveryDispute> => {
    const form = new FormData();
    form.append('category', category);
    form.append('description', description);
    if (photo) {
        form.append('photo', { uri: photo.uri, name: photo.name, type: photo.type } as any);
    }
    const { data } = await apiClient.post<ApiSuccessResponse<DeliveryDispute>>(
        `/shipments/${shipmentId}/dispute`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
};

export const getDispute = async (shipmentId: string): Promise<DeliveryDispute | null> => {
    const { data } = await apiClient.get<ApiSuccessResponse<DeliveryDispute | null>>(`/shipments/${shipmentId}/dispute`);
    return data.data;
};




const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let result = '';
    for (let i = 0; i < bytes.length; i += 3) {
        const b1 = bytes[i];
        const b2 = bytes[i + 1];
        const b3 = bytes[i + 2];
        result += BASE64_CHARS[b1 >> 2];
        result += BASE64_CHARS[((b1 & 3) << 4) | (b2 >> 4)];
        result += b2 === undefined ? '=' : BASE64_CHARS[((b2 & 15) << 2) | (b3 >> 6)];
        result += b3 === undefined ? '=' : BASE64_CHARS[b3 & 63];
    }
    return result;
};

// Real, backend-generated POD PDF (GET /shipments/:id/pod-pdf) — only
// available once DELIVERED. Returns base64 (not a blob URL) so the
// caller can hand it straight to react-native-share's data-URL support

export const getPodPdfBase64 = async (shipmentId: string): Promise<string> => {
    const { data } = await apiClient.get<ArrayBuffer>(`/shipments/${shipmentId}/pod-pdf`, {
        responseType: 'arraybuffer',
    });
    return arrayBufferToBase64(data);
};
