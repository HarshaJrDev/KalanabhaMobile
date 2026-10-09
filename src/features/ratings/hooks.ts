import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import RazorpayCheckout from 'react-native-razorpay';
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

interface TipDriverArgs {
    amount: number;
    driverName?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
}

// Same order-create → Razorpay checkout → verify round trip as
// usePayForShipment, just against the rating/tip endpoints and an
// amount the customer picks rather than the shipment's own price.
export const useTipDriver = (shipmentId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ amount, driverName, customerName, customerEmail, customerPhone }: TipDriverArgs) => {
            const order = await ratingsApi.createTipOrder(shipmentId, amount);

            const checkoutResult = await RazorpayCheckout.open({
                key: order.keyId,
                order_id: order.orderId,
                amount: order.amount,
                currency: order.currency,
                name: 'Kalanabha',
                description: driverName ? `Tip for ${driverName}` : 'Driver tip',
                prefill: {
                    name: customerName,
                    email: customerEmail,
                    contact: customerPhone,
                },
                theme: { color: '#FF7518' },
            });

            return ratingsApi.verifyTip(shipmentId, {
                amount,
                razorpay_order_id: checkoutResult.razorpay_order_id,
                razorpay_payment_id: checkoutResult.razorpay_payment_id,
                razorpay_signature: checkoutResult.razorpay_signature,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ratingKeys.forShipment(shipmentId) });
        },
    });
};
