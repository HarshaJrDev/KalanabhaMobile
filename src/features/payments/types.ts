// One-to-one with kalanabhaBackend/src/modules/payments — see
// PaymentsController/PaymentsService for the server side of this contract.

// POST /payments/orders response
export interface PaymentOrder {
    orderId: string;
    amount: number; // paise
    currency: string;
    keyId: string;
    paymentId: string;
}

// Razorpay checkout's success-callback shape, forwarded straight to
// POST /payments/verify.
export interface RazorpayCheckoutSuccess {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}
