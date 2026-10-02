// offlineMapCache.ts — pre-caches MapLibre tiles for every active
// ServiceArea so maps (LocationPinPicker, LiveTrackingMap) still render
// if the device loses signal mid-trip, instead of showing blank gray
// tiles. One offline pack per ServiceArea, a ~3km box around its center,
// zoom 12-16 (street-level detail without downloading a whole city).
// Best-effort and silent — a failed/slow download never blocks anything
// else in the app, it just means that one area's tiles aren't cached yet.
import { OfflineManager, type LngLatBounds } from '@maplibre/maplibre-react-native';
import type { ServiceArea } from '@features/settings/types';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
// ~0.015 degrees of lat/lng is roughly 1.5-1.7km at India's latitudes —
// good enough for "the app still shows a usable map around this
// locality offline", not a full offline basemap of the whole city.
const BOX_DEGREES = 0.015;

const boundsForArea = (area: ServiceArea): LngLatBounds => [
    area.lng - BOX_DEGREES,
    area.lat - BOX_DEGREES,
    area.lng + BOX_DEGREES,
    area.lat + BOX_DEGREES,
];

let cachingInFlight = false;

export const ensureServiceAreaTilesCached = async (areas: ServiceArea[]): Promise<void> => {
    // One caching pass at a time — repeated calls (e.g. Home remounting)
    // shouldn't queue up duplicate download attempts for the same areas.
    if (cachingInFlight || areas.length === 0) return;
    cachingInFlight = true;

    try {
        const existingPacks = await OfflineManager.getPacks();
        const existingAreaIds = new Set(existingPacks.map((p) => p.metadata?.areaId).filter(Boolean));

        for (const area of areas) {
            if (existingAreaIds.has(area.id)) continue;

            try {
                await OfflineManager.createPack(
                    {
                        mapStyle: MAP_STYLE_URL,
                        bounds: boundsForArea(area),
                        minZoom: 12,
                        maxZoom: 16,
                        metadata: { areaId: area.id, name: area.name },
                    },
                    () => { /* no progress UI — silent background cache */ },
                    (_pack, error) => {
                        if (__DEV__) console.warn(`[offlineMapCache] ${area.name} pack failed:`, error.message);
                    },
                );
            } catch (err) {
                // One area's download failing (e.g. offline right now)
                // shouldn't stop the rest from being attempted.
                if (__DEV__) console.warn(`[offlineMapCache] createPack failed for ${area.name}`, err);
            }
        }
    } catch (err) {
        if (__DEV__) console.warn('[offlineMapCache] getPacks failed', err);
    } finally {
        cachingInFlight = false;
    }
};
