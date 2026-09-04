import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ratingsApi from './api/ratings.api';
import type { CreateRatingInput } from './types';
import { useAuthState } from '@hooks/useAuthState';

export const ratingKeys = {
    forShipment: (id: string) => ['ratings', id] as const,
};

export const useShipmentRating = (shipmentId: string | undefined) => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: ratingKeys.forShipment(shipmentId ?? ''),
        queryFn: () => ratingsApi.getRating(shipmentId!),
        enabled: isAuthenticated && !!shipmentId,
    });
};

export const useSubmitRating = (shipmentId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateRatingInput) => ratingsApi.submitRating(shipmentId, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ratingKeys.forShipment(shipmentId) });
        },
    });
};
