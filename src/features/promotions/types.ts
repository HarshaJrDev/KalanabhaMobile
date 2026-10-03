


export interface PromoEvaluation {
    valid: boolean;
    discount: number;
    reason?: string;
}


export interface ActivePromoCode {
    id: string;
    code: string;
    discountType: 'FLAT' | 'PERCENT';
    value: number;
    maxDiscount: number | null;
    expiresAt: string | null;
}
