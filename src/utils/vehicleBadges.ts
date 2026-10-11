import type { VehicleConfig } from '@features/settings/types';

// Heavy Cargo threshold — 10T+ is squarely in the dedicated heavy-haul
// class (Low Bed Trailer, Heavy Haul Truck, Container), not an arbitrary
// cutoff picked for marketing effect.
export const HEAVY_CARGO_THRESHOLD_KG = 10_000;

// Capacity is more readable in tons for the heavy-truck classes (9000kg
// reads easier as "9 T") while staying exact for lighter ones where a
// fraction-of-a-ton figure would be a worse read than the kg number
// itself (a 750kg Pickup as "0.75 T" is less immediately legible).
export const formatVehicleCapacity = (maxWeightKg: number): string =>
    maxWeightKg >= 1000 ? `${(maxWeightKg / 1000).toFixed(maxWeightKg % 1000 === 0 ? 0 : 1)} T` : `${maxWeightKg} kg`;

// "Best Value" needs sibling awareness (lowest ratePerKm among the
// options actually on offer) — computed once over the full fleet so
// every screen that shows a badge agrees on which vehicle has it. Ties
// aren't broken arbitrarily into multiple badges — only the first
// vehicle at the minimum rate gets it.
export const getBestValueVehicleId = (vehicles: VehicleConfig[]): string | null => {
    if (vehicles.length === 0) return null;
    return vehicles.reduce((best, v) => (v.ratePerKm < best.ratePerKm ? v : best), vehicles[0]).id;
};

export type VehicleBadge = { label: string; variant: 'value' | 'heavy' } | null;

export const getVehicleBadge = (
    vehicle: VehicleConfig,
    bestValueId: string | null,
    labels: { bestValue: string; heavyCargo: string },
): VehicleBadge => {
    if (vehicle.id === bestValueId) return { label: labels.bestValue, variant: 'value' };
    if (vehicle.maxWeight >= HEAVY_CARGO_THRESHOLD_KG) return { label: labels.heavyCargo, variant: 'heavy' };
    return null;
};
