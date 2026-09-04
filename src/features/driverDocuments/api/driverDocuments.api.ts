import { apiClient } from '@api/client';
import type { ApiSuccessResponse } from '@api/types';
import type { DriverDocument, DriverDocumentType } from '../types';

// One-to-one with kalanabhaBackend DriverDocumentsController.

// Same multipart shape fuelExpenses.api.ts already uses — the caller
// supplies a file:// URI from react-native-image-picker, no separate
// upload helper needed.
export const uploadDriverDocument = async (type: DriverDocumentType, fileUri: string, fileName: string, mimeType: string): Promise<DriverDocument> => {
    const form = new FormData();
    form.append('type', type);
    form.append('file', { uri: fileUri, name: fileName, type: mimeType } as any);

    const { data } = await apiClient.post<ApiSuccessResponse<DriverDocument>>('/files/driver-documents', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
};

export const getMyDriverDocuments = async (): Promise<DriverDocument[]> => {
    const { data } = await apiClient.get<ApiSuccessResponse<DriverDocument[]>>('/files/driver-documents/mine');
    return data.data;
};
