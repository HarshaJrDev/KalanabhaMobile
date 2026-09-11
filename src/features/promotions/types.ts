// One-to-one with kalanabhaBackend/src/modules/promotions — see
// PromotionsController/PromotionsService for the server side.

export interface PromoEvaluation {
    valid: boolean;
    discount: number;
    reason?: string;
}

// GET /promotions/active — "Available Offers" discovery list.
export interface ActivePromoCode {
    id: string;
    code: string;
    discountType: 'FLAT' | 'PERCENT';
    value: number;
    maxDiscount: number | null;
    expiresAt: string | null;
}
