import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as shipmentsApi from './api/shipments.api';
import { toShipment } from './mapper';
import type {
    AssignShipmentPayload,
    CreateShipmentPayload,
    QuoteShipmentPayload,
} from './types';
import { useAuthState } from '@hooks/useAuthState';


export const shipmentKeys = {
    all: ['shipments'] as const,
    mine: () => [...shipmentKeys.all, 'mine'] as const,
    history: () => [...shipmentKeys.all, 'history'] as const,
    searching: () => [...shipmentKeys.all, 'searching'] as const,
    driverMine: () => [...shipmentKeys.all, 'driver-mine'] as const,
    admin: () => [...shipmentKeys.all, 'admin'] as const,
    detail: (id: string) => [...shipmentKeys.all, 'detail', id] as const,
};

const ACTIVE_SHIPMENT_POLL_MS = 8000;

export const useMyShipments = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: shipmentKeys.mine(),
        queryFn: async () => (await shipmentsApi.getMyShipments()).map(toShipment),
        enabled: isAuthenticated,
        
        
        
        
        refetchInterval: ACTIVE_SHIPMENT_POLL_MS,
    });
};



export const useMyShipmentsAsDriver = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: shipmentKeys.driverMine(),
        queryFn: async () => (await shipmentsApi.getMyShipmentsAsDriver()).map(toShipment),
        enabled: isAuthenticated,
        refetchInterval: ACTIVE_SHIPMENT_POLL_MS,
    });
};


export const useDriverEarningsSummary = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: [...shipmentKeys.all, 'driver-earnings-summary'] as const,
        queryFn: shipmentsApi.getDriverEarningsSummary,
        enabled: isAuthenticated,
    });
};





export const useMyShipmentHistory = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: shipmentKeys.history(),
        queryFn: async () => (await shipmentsApi.getMyShipmentHistory()).map(toShipment),
        enabled: isAuthenticated,
    });
};

export const useSearchingShipments = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: shipmentKeys.searching(),
        queryFn: async () => (await shipmentsApi.getSearchingShipments()).map(toShipment),
        enabled: isAuthenticated,
        refetchInterval: ACTIVE_SHIPMENT_POLL_MS,
    });
};

export const useAdminShipments = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: shipmentKeys.admin(),
        queryFn: async () => (await shipmentsApi.getAllShipmentsForAdmin()).items.map(toShipment),
        enabled: isAuthenticated,
        refetchInterval: ACTIVE_SHIPMENT_POLL_MS,
    });
};

export const useShipment = (id: string | undefined) => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: shipmentKeys.detail(id ?? ''),
        queryFn: async () => toShipment(await shipmentsApi.getShipmentById(id!)),
        enabled: isAuthenticated && !!id,
        refetchInterval: ACTIVE_SHIPMENT_POLL_MS,
    });
};

// Screen -> hook -> shipments.api -> GET /shipments/:id/history -> cache
// -> UI. ShipmentDetailsScreen's Tracking Timeline; real status

export const useShipmentHistory = (id: string | undefined) => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: [...shipmentKeys.detail(id ?? ''), 'history'] as const,
        queryFn: () => shipmentsApi.getShipmentHistory(id!),
        enabled: isAuthenticated && !!id,
        refetchInterval: ACTIVE_SHIPMENT_POLL_MS,
    });
};

export const useQuoteShipment = () => {
    return useMutation({
        mutationFn: (payload: QuoteShipmentPayload) => shipmentsApi.quoteShipment(payload),
    });
};

type CreateShipmentMutationVariables =
    | CreateShipmentPayload
    | {
        payload: CreateShipmentPayload;
        idempotencyKey?: string;
    };

export const useCreateShipment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variables: CreateShipmentMutationVariables) => {
            if ('payload' in variables) {
                return shipmentsApi.createShipment(variables.payload, variables.idempotencyKey);
            }
            return shipmentsApi.createShipment(variables);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: shipmentKeys.mine() });
            queryClient.invalidateQueries({ queryKey: shipmentKeys.history() });
        },
    });
};

export const useShipmentPodPdf = () => {
    return useMutation({
        mutationFn: (shipmentId: string) => shipmentsApi.getPodPdfBase64(shipmentId),
    });
};




const useInvalidateShipmentCaches = (id: string) => {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: shipmentKeys.mine() });
        queryClient.invalidateQueries({ queryKey: shipmentKeys.history() });
        queryClient.invalidateQueries({ queryKey: shipmentKeys.searching() });
        queryClient.invalidateQueries({ queryKey: shipmentKeys.driverMine() });
        queryClient.invalidateQueries({ queryKey: shipmentKeys.admin() });
        queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(id) });
    };
};

export const useAcceptShipment = (id: string) => {
    const invalidate = useInvalidateShipmentCaches(id);
    return useMutation({
        mutationFn: () => shipmentsApi.acceptShipment(id),
        onSuccess: invalidate,
    });
};

export const useAssignShipment = (id: string) => {
    const invalidate = useInvalidateShipmentCaches(id);
    return useMutation({
        mutationFn: (payload: AssignShipmentPayload) => shipmentsApi.assignShipment(id, payload),
        onSuccess: invalidate,
    });
};

export const useArriveAtShipment = (id: string) => {
    const invalidate = useInvalidateShipmentCaches(id);
    return useMutation({
        mutationFn: ({ latitude, longitude }: { latitude: number; longitude: number }) =>
            shipmentsApi.arriveAtShipment(id, latitude, longitude),
        onSuccess: invalidate,
    });
};

export const useStartDelivery = (id: string) => {
    const invalidate = useInvalidateShipmentCaches(id);
    return useMutation({
        mutationFn: (otp: string) => shipmentsApi.startDelivery(id, otp),
        onSuccess: invalidate,
    });
};

export const useCompleteDelivery = (id: string) => {
    const invalidate = useInvalidateShipmentCaches(id);
    return useMutation({
        mutationFn: (otp: string) => shipmentsApi.completeDelivery(id, otp),
        onSuccess: invalidate,
    });
};

export const useCompleteShipmentStop = (id: string) => {
    const invalidate = useInvalidateShipmentCaches(id);
    return useMutation({
        mutationFn: (stopId: string) => shipmentsApi.completeShipmentStop(id, stopId),
        onSuccess: invalidate,
    });
};

export const useCancelShipment = (id: string) => {
    const invalidate = useInvalidateShipmentCaches(id);
    return useMutation({
        mutationFn: (reason?: string) => shipmentsApi.cancelShipment(id, reason),
        onSuccess: invalidate,
    });
};

export const useRescheduleShipment = (id: string) => {
    const invalidate = useInvalidateShipmentCaches(id);
    return useMutation({
        mutationFn: (scheduledAt: string) => shipmentsApi.rescheduleShipment(id, scheduledAt),
        onSuccess: invalidate,
    });
};



export const useInsuranceClaim = (shipmentId: string | undefined, insuranceRequested: boolean | undefined) => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: [...shipmentKeys.all, 'insurance-claim', shipmentId],
        queryFn: () => shipmentsApi.getInsuranceClaim(shipmentId!),
        enabled: isAuthenticated && !!shipmentId && !!insuranceRequested,
    });
};



export const useDispute = (shipmentId: string | undefined) => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: [...shipmentKeys.all, 'dispute', shipmentId],
        queryFn: () => shipmentsApi.getDispute(shipmentId!),
        enabled: isAuthenticated && !!shipmentId,
    });
};

export const useFileDispute = (shipmentId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            category,
            description,
            photo,
        }: {
            category: 'WRONG_ITEM' | 'MISSING_ITEM' | 'OVERCHARGED' | 'OTHER';
            description: string;
            photo?: { uri: string; name: string; type: string };
        }) => shipmentsApi.fileDispute(shipmentId, category, description, photo),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...shipmentKeys.all, 'dispute', shipmentId] });
        },
    });
};

export const useFileInsuranceClaim = (shipmentId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ description, photo }: { description: string; photo?: { uri: string; name: string; type: string } }) =>
            shipmentsApi.fileInsuranceClaim(shipmentId, description, photo),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...shipmentKeys.all, 'insurance-claim', shipmentId] });
        },
    });
};
