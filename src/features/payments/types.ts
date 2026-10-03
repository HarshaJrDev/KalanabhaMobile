



export interface PaymentOrder {
    orderId: string;
    amount: number; 
    currency: string;
    keyId: string;
    paymentId: string;
}



export interface RazorpayCheckoutSuccess {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}
