// useLocationSearch.ts
//
// Real pickup/drop location search, extending — not replacing — the
// existing ServiceArea picker already in addOrders.tsx's PlacePicker.
// ServiceArea is a real, admin-managed "which localities does this
// platform actually operate in" list (kalanabhaBackend model) — it's a
// genuine business constraint, not just a UI convenience, so this
// deliberately does NOT add free-text/geocoded address search that could
// resolve to somewhere the platform can't actually serve. Instead it adds
// the real, honestly-buildable pieces on top of that same real list:
// debounced search, GPS-based "current location" resolved to the nearest
// real serviceable locality, and a locally-persisted recent-picks list.
import { useCallback, useEffect, useMemo, useState } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { storage } from '@services/storage';
import { haversineDistanceKm } from '@utils/geo';
import type { ServiceArea } from '@features/settings/types';

const RECENTS_KEY = 'recent_service_areas';
const MAX_RECENTS = 5;
const DEBOUNCE_MS = 250;

const readRecents = (): string[] => {
    try {
        const raw = storage.getString(RECENTS_KEY);
        return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
        return [];
    }
};

const writeRecents = (ids: string[]) => {
    try {
        storage.set(RECENTS_KEY, JSON.stringify(ids.slice(0, MAX_RECENTS)));
    } catch {
        // Non-critical — recents are a convenience, not load-bearing.
    }
};

// Records a real user pick so it can resurface as a "Recent" next time —
// call this from wherever a ServiceArea is actually selected (PlacePicker).
export const recordRecentServiceArea = (id: string) => {
    const current = readRecents().filter((existing) => existing !== id);
    writeRecents([id, ...current]);
};

export interface UseLocationSearchResult {
    query: string;
    setQuery: (q: string) => void;
    /** Debounced, filtered results grouped by city, same shape PlacePicker already renders. */
    results: Record<string, ServiceArea[]>;
    /** Real recently-picked areas (most recent first), empty until the user has picked at least one. */
    recents: ServiceArea[];
    /** Requests real GPS, resolves to the nearest real ServiceArea (haversine over the real list — no geocoding API involved). null if permission denied/no fix/no areas configured nearby. */
    locateNearestServiceArea: () => Promise<ServiceArea | null>;
    locatingCurrentPosition: boolean;
}

export const useLocationSearch = (areas: ServiceArea[]): UseLocationSearchResult => {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [locatingCurrentPosition, setLocatingCurrentPosition] = useState(false);

    // Debounced — do not re-filter (or, if this were ever backed by a real
    // network call, re-request) on every keystroke.
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [query]);

    const results = useMemo(() => {
        const q = debouncedQuery.trim().toLowerCase();
        const list = q ? areas.filter((a) => a.name.toLowerCase().includes(q) || a.city.toLowerCase().includes(q)) : areas;
        const byCity: Record<string, ServiceArea[]> = {};
        list.forEach((a) => {
            byCity[a.city] = byCity[a.city] ?? [];
            byCity[a.city].push(a);
        });
        return byCity;
    }, [debouncedQuery, areas]);

    const recents = useMemo(() => {
        const ids = readRecents();
        return ids.map((id) => areas.find((a) => a.id === id)).filter((a): a is ServiceArea => !!a);
        // Re-derives from `areas` each render rather than caching stale
        // ServiceArea objects — if admin deactivates/renames one, recents
        // reflect that instead of showing a fabricated stale copy.
    }, [areas]);

    const locateNearestServiceArea = useCallback((): Promise<ServiceArea | null> => {
        return new Promise((resolve) => {
            setLocatingCurrentPosition(true);
            Geolocation.getCurrentPosition(
                (position) => {
                    setLocatingCurrentPosition(false);
                    if (areas.length === 0) {
                        resolve(null);
                        return;
                    }
                    const here = { lat: position.coords.latitude, lng: position.coords.longitude };
                    let nearest = areas[0];
                    let nearestKm = haversineDistanceKm(here, { lat: nearest.lat, lng: nearest.lng });
                    for (const area of areas.slice(1)) {
                        const d = haversineDistanceKm(here, { lat: area.lat, lng: area.lng });
                        if (d < nearestKm) {
                            nearest = area;
                            nearestKm = d;
                        }
                    }
                    resolve(nearest);
                },
                () => {
                    setLocatingCurrentPosition(false);
                    resolve(null);
                },
                { enableHighAccuracy: true, timeout: 15000 },
            );
        });
    }, [areas]);

    return { query, setQuery, results, recents, locateNearestServiceArea, locatingCurrentPosition };
};
