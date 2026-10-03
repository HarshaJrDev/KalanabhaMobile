









import { useMemo, useState } from 'react';
import type { VehicleConfig } from '@features/settings/types';

export interface UseVehicleSearchOptions {
        minCapacityKg?: number;
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
    
    const excludedForCapacity = useMemo(() => {
        if (!minCapacityKg || minCapacityKg <= 0) return [];
        return (allConfigs ?? []).filter((v) => v.active && v.maxWeight < minCapacityKg);
    }, [allConfigs, minCapacityKg]);

    return { query, setQuery, results, excludedForCapacity };
};
