









const OSRM_BASE_URL = 'https://router.project-osrm.org';
const REQUEST_TIMEOUT_MS = 8000;

export interface RouteStep {
    instruction: string;
    distanceMeters: number;
    maneuver: string;
}

export interface RouteResult {
    geometry: { lat: number; lng: number }[];
    distanceMeters: number;
    durationSeconds: number;
    steps: RouteStep[];
}

interface OsrmStep {
    distance: number;
    maneuver: { type: string; modifier?: string };
    name: string;
}

interface OsrmLeg {
    steps: OsrmStep[];
}

interface OsrmRoute {
    geometry: { coordinates: [number, number][] };
    distance: number;
    duration: number;
    legs: OsrmLeg[];
}

interface OsrmResponse {
    code: string;
    routes: OsrmRoute[];
}

const describeStep = (step: OsrmStep): string => {
    const { type, modifier } = step.maneuver;
    if (type === 'depart') return 'Head out';
    if (type === 'arrive') return 'You have arrived';
    const direction = modifier ? ` ${modifier}` : '';
    const onto = step.name ? ` onto ${step.name}` : '';
    return `${type}${direction}${onto}`.trim();
};

export const getDrivingRoute = async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
): Promise<RouteResult | null> => {
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const url = `${OSRM_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return null;
        const data: OsrmResponse = await response.json();
        if (data.code !== 'Ok' || !data.routes.length) return null;

        const route = data.routes[0];
        return {
            geometry: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
            distanceMeters: route.distance,
            durationSeconds: route.duration,
            steps: route.legs.flatMap((leg) =>
                leg.steps.map((step) => ({
                    instruction: describeStep(step),
                    distanceMeters: step.distance,
                    maneuver: step.maneuver.type,
                })),
            ),
        };
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
};
