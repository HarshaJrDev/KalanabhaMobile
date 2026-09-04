import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api/driverDocuments.api';
import type { DriverDocumentType } from './types';

export const driverDocumentKeys = {
    mine: ['driver-documents', 'mine'] as const,
};

// Screen -> hook -> driverDocuments.api -> GET /files/driver-documents/mine
// -> cache -> UI.
export const useMyDriverDocuments = () => {
    return useQuery({
        queryKey: driverDocumentKeys.mine,
        queryFn: api.getMyDriverDocuments,
        staleTime: 30 * 1000,
    });
};

export const useUploadDriverDocument = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ type, fileUri, fileName, mimeType }: { type: DriverDocumentType; fileUri: string; fileName: string; mimeType: string }) =>
            api.uploadDriverDocument(type, fileUri, fileName, mimeType),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: driverDocumentKeys.mine }),
    });
};
