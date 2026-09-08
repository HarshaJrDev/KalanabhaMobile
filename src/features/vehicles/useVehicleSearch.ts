// useVehicleSearch.ts
//
// Real vehicle search/filter over the existing admin-managed VehicleConfig
// list (GET /settings/vehicle-configs via useVehicleConfigs) — extends
// what addOrders.tsx's vehicle-selection step already fetches rather than
// a second parallel vehicle list. Adds the two real, backend-data-backed
// filters that weren't applied before: capacity (VehicleConfig.maxWeight,
// a real field that existed but was never used to actually exclude a
// vehicle too small for the entered goods weight) and free-text search
// over the vehicle name.
import { useMemo, useState } from 'react';
import type { VehicleConfig } from '@features/settings/types';

export interface UseVehicleSearchOptions {
    /** Exclude vehicles below this weight, in kg. Ignored if not a positive number (e.g. weight not entered yet, or a House Shifting order that doesn't use weight). */
    minCapacityKg?: number;
    /** Vehicle names to exclude outright (e.g. bike for House Shifting) regardless of capacity. */
    excludeNames?: string[];
}

export const useVehicleSearch = (allConfigs: VehicleConfig[] | undefined, options: UseVehicleSearchOptions = {}) => {
    const [query, setQuery] = useState('');
    const { minCapacityKg, excludeNames } = options;

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        return (allConfigs ?? []).filter((v) => {
            if (!v.active) return false;
            if (excludeNames?.some((n) => n.toLowerCase() === v.name.toLowerCase())) return false;
            if (minCapacityKg && minCapacityKg > 0 && v.maxWeight < minCapacityKg) return false;
            if (q && !v.name.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [allConfigs, minCapacityKg, excludeNames, query]);

    // Real reason a vehicle got excluded, for a "no suitable vehicle"
    // empty state that actually explains why rather than a bare "no
    // results" — e.g. every active vehicle's maxWeight is below what was
    // entered.
    const excludedForCapacity = useMemo(() => {
        if (!minCapacityKg || minCapacityKg <= 0) return [];
        return (allConfigs ?? []).filter((v) => v.active && v.maxWeight < minCapacityKg);
    }, [allConfigs, minCapacityKg]);

    return { query, setQuery, results, excludedForCapacity };
};
