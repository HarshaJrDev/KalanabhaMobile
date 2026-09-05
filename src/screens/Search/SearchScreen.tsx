import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native'
import React, { useMemo, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import CustomInput from '@components/CustomInput'
import { Search, ChevronRight, QrCode } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMyShipments } from '@features/shipments/hooks'
import { AsyncState } from '@components/AsyncState'
import FONTS from '@utils/fonts';

// Screen -> useMyShipments -> shipments.api -> GET /shipments/mine -> client
// filter by trackingId/shipmentId -> UI. There's no backend
// search-by-tracking-ID endpoint (GET /shipments/:id looks up by internal
// UUID, not the human-readable tracking ID) — searching within the
// customer's own already-fetched shipments is the honest scope this can
// support without inventing an endpoint.
const SearchScreen = () => {
    const navigation = useNavigation();
    const [query, setQuery] = useState('');
    const { data: shipments, isLoading, error, refetch } = useMyShipments();

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return (shipments ?? []).filter(
            (s) =>
                s.trackingId.toLowerCase().includes(q) ||
                s.shipmentId.toLowerCase().includes(q),
        );
    }, [query, shipments]);

    return (
        <SafeAreaView style={styles.container}>
            <CustomInput
                isEnable
                placeholder="Search Tracking ID"
                leftIcon={Search}
                rightIcon={QrCode}
                onRightIconPress={() => (navigation as any).navigate('QRScan')}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                returnKeyType="search"
            />

            {!!query.trim() && (
                <AsyncState
                    isLoading={isLoading}
                    error={error}
                    onRetry={refetch}
                    isEmpty={results.length === 0}
                    emptyTitle="No matching shipments"
                    emptyMessage="Check the tracking ID and try again."
                >
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.list}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.row}
                                onPress={() =>
                                    (navigation as any).navigate('ShipmentDetailsScreen', { id: item.id })
                                }
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.trackingId}>{item.trackingId}</Text>
                                    <Text style={styles.route} numberOfLines={1}>
                                        {item.pickup.address} → {item.drop.address}
                                    </Text>
                                </View>
                                <ChevronRight color="#9CA3AF" size={18} />
                            </TouchableOpacity>
                        )}
                    />
                </AsyncState>
            )}
        </SafeAreaView>
    )
}

export default SearchScreen

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 16 },
    list: { marginTop: 16, gap: 8 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 14,
    },
    trackingId: { fontSize: 14, fontFamily: FONTS.BOLD_PRIMARY, color: '#111827' },
    route: { fontSize: 12, color: '#6B7280', marginTop: 2 },
})
