import { useMutation, useQueryClient } from '@tanstack/react-query';
import RazorpayCheckout from 'react-native-razorpay';
import * as paymentsApi from './api';
import { shipmentKeys } from '@features/shipments/hooks';

interface PayForShipmentArgs {
    shipmentId: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
}

// Full pay flow in one call: create the Razorpay order server-side, open
// the native checkout sheet, then verify the signature server-side.
// Throws (with a user-facing message) on cancellation or a failed verify —
// callers show a toast, same pattern every other mutation in this app
// follows via react-query's onError.
export const usePayForShipment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ shipmentId, customerName, customerEmail, customerPhone }: PayForShipmentArgs) => {
            const order = await paymentsApi.createPaymentOrder(shipmentId);

            const checkoutResult = await RazorpayCheckout.open({
                key: order.keyId,
                order_id: order.orderId,
                amount: order.amount,
                currency: order.currency,
                name: 'Kalanabha',
                description: 'Shipment payment',
                prefill: {
                    name: customerName,
                    email: customerEmail,
                    contact: customerPhone,
                },
                theme: { color: '#FF7518' },
            });

            return paymentsApi.verifyPayment({
                razorpay_order_id: checkoutResult.razorpay_order_id,
                razorpay_payment_id: checkoutResult.razorpay_payment_id,
                razorpay_signature: checkoutResult.razorpay_signature,
            });
        },
        onSuccess: (_result, { shipmentId }) => {
            queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(shipmentId) });
            queryClient.invalidateQueries({ queryKey: shipmentKeys.mine() });
        },
    });
};
