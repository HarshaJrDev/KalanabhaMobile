






import { OfflineManager, type LngLatBounds } from '@maplibre/maplibre-react-native';
import type { ServiceArea } from '@features/settings/types';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';



const BOX_DEGREES = 0.015;

const boundsForArea = (area: ServiceArea): LngLatBounds => [
    area.lng - BOX_DEGREES,
    area.lat - BOX_DEGREES,
    area.lng + BOX_DEGREES,
    area.lat + BOX_DEGREES,
];

let cachingInFlight = false;

export const ensureServiceAreaTilesCached = async (areas: ServiceArea[]): Promise<void> => {
    
    
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
                    () => {  },
                    (_pack, error) => {
                        if (__DEV__) console.warn(`[offlineMapCache] ${area.name} pack failed:`, error.message);
                    },
                );
            } catch (err) {
                
                
                if (__DEV__) console.warn(`[offlineMapCache] createPack failed for ${area.name}`, err);
            }
        }
    } catch (err) {
        if (__DEV__) console.warn('[offlineMapCache] getPacks failed', err);
    } finally {
        cachingInFlight = false;
    }
};
