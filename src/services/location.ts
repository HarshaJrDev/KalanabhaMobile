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