// One-to-one with kalanabhaBackend/src/modules/promotions — see
// PromotionsController/PromotionsService for the server side.

export interface PromoEvaluation {
    valid: boolean;
    discount: number;
    reason?: string;
}
