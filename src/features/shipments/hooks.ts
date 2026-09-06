import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as shipmentsApi from './api/shipments.api';
import { toShipment } from './mapper';
import type {
    AssignShipmentPayload,
    CreateShipmentPayload,
    QuoteShipmentPayload,
} from './types';
import { useAuthState } from '@hooks/useAuthState';

// Screen -> hook -> shipments.api -> backend -> BackendShipment[] -> toShipment -> cache -> UI
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
        // Active shipments can change server-side (auto-match, driver accept)
        // without any local action, so poll while the screen is focused —
        // there's no shipment-list push channel, only the per-shipment
        // chat/tracking sockets.
        refetchInterval: ACTIVE_SHIPMENT_POLL_MS,
    });
};

// driver only — see getMyShipmentsAsDriver. Powers both the "active
// delivery" chat entry point and trip history on the driver side.
export const useMyShipmentsAsDriver = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: shipmentKeys.driverMine(),
        queryFn: async () => (await shipmentsApi.getMyShipmentsAsDriver()).map(toShipment),
        enabled: isAuthenticated,
        refetchInterval: ACTIVE_SHIPMENT_POLL_MS,
    });
};

// Every shipment this customer has ever made, any status — see
// getMyShipmentHistory. Powers Profile.tsx's real stats and Transactions
// History; doesn't need the active-shipment poll interval since past
// shipments don't change.
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
// transitions, not a guessed 'placed'/'picked-up'/'in-transit' sequence.
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

export const useCreateShipment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateShipmentPayload) => shipmentsApi.createShipment(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: shipmentKeys.mine() });
            queryClient.invalidateQueries({ queryKey: shipmentKeys.history() });
        },
    });
};

// Shared invalidation for every mutation that changes a shipment's status —
// keeps `mine`/`searching`/`admin`/`detail` in sync without each screen
// having to know which lists it might be showing in.
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

export const useCancelShipment = (id: string) => {
    const invalidate = useInvalidateShipmentCaches(id);
    return useMutation({
        mutationFn: (reason?: string) => shipmentsApi.cancelShipment(id, reason),
        onSuccess: invalidate,
    });
};
