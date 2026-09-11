declare module 'react-native-razorpay' {
    export interface RazorpayCheckoutOptions {
        key: string;
        order_id: string;
        amount: number;
        currency: string;
        name: string;
        description?: string;
        image?: string;
        prefill?: {
            name?: string;
            email?: string;
            contact?: string;
        };
        theme?: { color?: string };
    }

    export interface RazorpaySuccessResponse {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
    }

    const RazorpayCheckout: {
        open(options: RazorpayCheckoutOptions): Promise<RazorpaySuccessResponse>;
    };

    export default RazorpayCheckout;
}
