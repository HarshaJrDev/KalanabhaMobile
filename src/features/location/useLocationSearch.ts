











import { useCallback, useEffect, useMemo, useState } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { storage } from '@services/storage';
import { haversineDistanceKm } from '@utils/geo';
import { ensureLocationPermission } from '@utils/locationPermission';
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
        
    }
};



export const recordRecentServiceArea = (id: string) => {
    const current = readRecents().filter((existing) => existing !== id);
    writeRecents([id, ...current]);
};

export interface UseLocationSearchResult {
    query: string;
    setQuery: (q: string) => void;
        results: Record<string, ServiceArea[]>;
        recents: ServiceArea[];
        locateNearestServiceArea: () => Promise<ServiceArea | null>;
    locatingCurrentPosition: boolean;
}

export const useLocationSearch = (areas: ServiceArea[]): UseLocationSearchResult => {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [locatingCurrentPosition, setLocatingCurrentPosition] = useState(false);

    
    
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
        
        
        
    }, [areas]);

    const locateNearestServiceArea = useCallback(async (): Promise<ServiceArea | null> => {
        const granted = await ensureLocationPermission();
        if (!granted) return null;

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
