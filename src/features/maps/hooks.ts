import { useQuery } from '@tanstack/react-query';
import * as mapsApi from './api/maps.api';
import { useAuthState } from '@hooks/useAuthState';

export const mapsKeys = {
    fuelStations: (lat: number, lng: number, radiusKm: number) =>
        ['maps', 'fuel-stations', lat.toFixed(3), lng.toFixed(3), radiusKm] as const,
};

// Screen -> hook -> maps.api -> GET /maps/fuel-stations -> cache -> UI.
// Rounds lat/lng to ~100m for the cache key so tiny GPS jitter doesn't
// refetch on every render — a driver looking for fuel doesn't need
// meter-level cache precision.
export const useNearbyFuelStations = (lat: number | null, lng: number | null, radiusKm = 5) => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: mapsKeys.fuelStations(lat ?? 0, lng ?? 0, radiusKm),
        queryFn: () => mapsApi.getNearbyFuelStations(lat!, lng!, radiusKm),
        enabled: isAuthenticated && lat != null && lng != null,
        staleTime: 2 * 60 * 1000,
    });
};
