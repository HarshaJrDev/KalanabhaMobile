
export const RATING_TAGS = [
    'Punctual Delivery',
    'Careful Handling',
    'Polite & Professional',
    'Secure Tie-down',
    'Fast Route Navigation',
    'Helpful with Loading',
] as const;
export type RatingTag = (typeof RATING_TAGS)[number];


export interface Rating {
    id: string;
    shipmentId: string;
    raterId: string;
    driverId: string;
    stars: number;
    tags: string[];
    note: string | null;
    
    
    serviceStars: number | null;
    tipAmount: number;
    tipPaymentId: string | null;
    createdAt: string;
}

export interface TipOrder {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
}

export interface CreateRatingInput {
    stars: number;
    tags: RatingTag[];
    note?: string;
    serviceStars?: number;
}
