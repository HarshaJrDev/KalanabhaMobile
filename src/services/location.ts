import { apiClient } from '@api/client';

// Routed through kalanabhaBackend's /maps/geocode/* proxy (not Nominatim
// directly) — every device sharing one backend-enforced rate limit and
// cache instead of each phone hammering the public Nominatim instance
// independently, which was out of compliance with its usage policy.
export const reverseGeocode = async (
    lat: number,
    lon: number,
    signal?: AbortSignal,
): Promise<string> => {
    const { data } = await apiClient.get('/maps/geocode/reverse', {
        params: { lat, lng: lon },
        signal,
        skipGlobalErrorToast: true,
    });
    return data.data.displayName;
};

// Sender/receiver addresses in the order form are free-typed text with no
// coordinates. This turns an address string into lat/lng so we can compute
// a real distance-based fare (see StepOrderDetails's fare estimate) instead
// of the flat per-service-type price.
export const forwardGeocode = async (
    address: string,
    signal?: AbortSignal,
): Promise<{ lat: number; lng: number } | null> => {
    try {
        const { data } = await apiClient.get('/maps/geocode/search', {
            params: { q: address },
            signal,
            skipGlobalErrorToast: true,
        });
        const results: Array<{ lat: number; lng: number }> = data.data;
        if (!results.length) return null;
        return { lat: results[0].lat, lng: results[0].lng };
    } catch {
        return null;
    }
};
