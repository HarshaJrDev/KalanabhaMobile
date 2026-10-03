













import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { ArrowUpRight } from 'lucide-react-native';
import type { RouteResult } from '@features/navigation/osrm';
import { useTranslation } from 'react-i18next';
import FONTS from '@utils/fonts';

export const TurnByTurnRouteLine: React.FC<{ route: RouteResult | null }> = ({ route }) => {
    if (!route) return null;
    return (
        <GeoJSONSource
            id="turnByTurnRoute"
            data={{
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: route.geometry.map((p) => [p.lng, p.lat]),
                },
            }}
        >
            <Layer
                id="turnByTurnRouteLine"
                type="line"
                style={{ lineColor: '#2563EB', lineWidth: 4, lineCap: 'round', lineJoin: 'round' }}
            />
        </GeoJSONSource>
    );
};

interface TurnByTurnBannerProps {
    loading: boolean;
    nextStep: { instruction: string; distanceMeters: number } | null;
}

export const TurnByTurnBanner: React.FC<TurnByTurnBannerProps> = ({ loading, nextStep }) => {
    const { t } = useTranslation();
    return (
        <View style={styles.banner} pointerEvents="none">
            {loading ? (
                <ActivityIndicator color="#fff" size="small" />
            ) : nextStep ? (
                <>
                    <ArrowUpRight color="#fff" size={20} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.instruction} numberOfLines={1}>{nextStep.instruction}</Text>
                        <Text style={styles.distance}>{Math.round(nextStep.distanceMeters)} m</Text>
                    </View>
                </>
            ) : (
                <Text style={styles.instruction}>{t('turnByTurnNav.calculatingRoute')}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    banner: {
        position: 'absolute', top: 10, left: 10, right: 10,
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(17,24,39,0.9)', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 10,
    },
    instruction: { color: '#fff', fontSize: 13, fontFamily: FONTS.BOLD_PRIMARY },
    distance: { color: '#D1D5DB', fontSize: 11, fontFamily: FONTS.PRIMARY, marginTop: 2 },
});
