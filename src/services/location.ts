export const reverseGeocode = async (
    lat: number,
    lon: number,
    signal?: AbortSignal
): Promise<string> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { signal: signal ?? controller.signal }
        );

        if (!res.ok) throw new Error('Failed address fetch');

        const json = await res.json();
        return json.display_name;
    } finally {
        clearTimeout(timeout);
    }
};

// Sender/receiver addresses in the order form are free-typed text with no
// coordinates. This turns an address string into lat/lng so we can compute
// a real distance-based fare (see StepOrderDetails's fare estimate) instead
// of the flat per-service-type price.
export const forwardGeocode = async (
    address: string,
    signal?: AbortSignal
): Promise<{ lat: number; lng: number } | null> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
            { signal: signal ?? controller.signal }
        );

        if (!res.ok) return null;

        const json = await res.json();
        if (!Array.isArray(json) || json.length === 0) return null;

        return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
};