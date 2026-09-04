// Mirrors kalanabhaBackend's RATING_TAGS exactly (create-rating.dto.ts).
export const RATING_TAGS = [
    'Punctual Delivery',
    'Careful Handling',
    'Polite & Professional',
    'Secure Tie-down',
    'Fast Route Navigation',
    'Helpful with Loading',
] as const;
export type RatingTag = (typeof RATING_TAGS)[number];

// GET/POST /shipments/:id/rating response row.
export interface Rating {
    id: string;
    shipmentId: string;
    raterId: string;
    driverId: string;
    stars: number;
    tags: string[];
    note: string | null;
    createdAt: string;
}

export interface CreateRatingInput {
    stars: number;
    tags: RatingTag[];
    note?: string;
}
