import { apiClient } from '@api/client';





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
