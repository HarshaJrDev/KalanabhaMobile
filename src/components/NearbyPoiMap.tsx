import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Map, Camera, Marker, type LngLat } from '@maplibre/maplibre-react-native';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export interface PoiMapPoint {
    id: string;
    lat: number;
    lng: number;
}

interface NearbyPoiMapProps {
    center: { lat: number; lng: number };
    points: PoiMapPoint[];
    selectedId?: string | null;
    onSelectPoint?: (id: string) => void;
    height?: number;
    markerColor?: string;
}

// Generic sibling to LiveTrackingMap — that component is shaped
// specifically around a shipment's pickup/drop/driver trio. This one
// takes an arbitrary list of nearby points (fuel stations, toll gates,
// …) plus a "you are here" marker, for driver-utility screens that
// aren't tracking a delivery.
export const NearbyPoiMap: React.FC<NearbyPoiMapProps> = ({ center, points, selectedId, onSelectPoint, height = 200, markerColor = '#FF7518' }) => {
    const centerLngLat = useMemo<LngLat>(() => [center.lng, center.lat], [center.lat, center.lng]);

    return (
        <View style={[styles.container, { height }]}>
            <Map style={styles.map} mapStyle={MAP_STYLE_URL}>
                <Camera center={centerLngLat} zoom={12} />

                <Marker id="me" lngLat={centerLngLat}>
                    <View style={styles.meMarker} />
                </Marker>

                {points.map(point => (
                    <Marker key={point.id} id={point.id} lngLat={[point.lng, point.lat]} onPress={() => onSelectPoint?.(point.id)}>
                        <View
                            style={[
                                styles.poiMarker,
                                { backgroundColor: markerColor },
                                selectedId === point.id && styles.poiMarkerSelected,
                            ]}
                        />
                    </Marker>
                ))}
            </Map>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%', borderRadius: 14, overflow: 'hidden' },
    map: { flex: 1 },
    meMarker: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2563EB', borderWidth: 2, borderColor: '#fff' },
    poiMarker: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
    poiMarkerSelected: { width: 22, height: 22, borderRadius: 11 },
});

export default NearbyPoiMap;
