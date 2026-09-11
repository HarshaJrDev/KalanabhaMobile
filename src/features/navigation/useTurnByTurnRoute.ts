import { useEffect, useRef, useState } from 'react';
import { getDrivingRoute, type RouteResult } from './osrm';
import { haversineDistanceKm } from '@utils/geo';

interface MapPoint {
    lat: number;
    lng: number;
}

// Re-fetch the route once the driver has drifted this far off the last
// computed line — cheap, avoids hammering the free public OSRM instance
// on every single GPS tick.
const REROUTE_THRESHOLD_KM = 0.15;

export const useTurnByTurnRoute = (origin: MapPoint | null | undefined, destination: MapPoint | null | undefined) => {
    const [route, setRoute] = useState<RouteResult | null>(null);
    const [loading, setLoading] = useState(false);
    const lastOriginRef = useRef<MapPoint | null>(null);

    useEffect(() => {
        if (!origin || !destination) return;

        const last = lastOriginRef.current;
        const driftedEnough = !last || haversineDistanceKm(last, origin) >= REROUTE_THRESHOLD_KM;
        if (!driftedEnough) return;

        let cancelled = false;
        setLoading(true);
        getDrivingRoute(origin, destination).then((result) => {
            if (cancelled) return;
            setLoading(false);
            if (result) {
                setRoute(result);
                lastOriginRef.current = origin;
            }
        });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

    const nextStep = route?.steps.find((s) => s.maneuver !== 'depart') ?? null;

    return { route, loading, nextStep };
};
