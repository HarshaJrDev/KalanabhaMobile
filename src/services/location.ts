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





export interface AddressSuggestion {
  displayName: string;
  lat: number;
  lng: number;
}

// Up to 5 live suggestions as the user types — the backend's
// /maps/geocode/search endpoint is deliberately rate-limited per-user
// specifically for this (see kalanabhaBackend's MapsController comment),
// separate from forwardGeocode below which only ever wants one result.
export const searchAddress = async (
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> => {
  try {
    const { data } = await apiClient.get('/maps/geocode/search', {
      params: { q: query },
      signal,
      skipGlobalErrorToast: true,
    });
    return data.data;
  } catch {
    return [];
  }
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
