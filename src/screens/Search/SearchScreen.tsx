import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import CustomInput from '@components/CustomInput'
import { Search, ChevronRight, QrCode } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useOrderSearch } from '@features/shipments/useOrderSearch'
import { AsyncState } from '@components/AsyncState'
import { useTranslation } from 'react-i18next'
import FONTS from '@utils/fonts';

// Screen -> useOrderSearch -> shipments.api -> GET /shipments/mine ->
// client filter by trackingId/shipmentId -> UI.
const SearchScreen = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { query, setQuery, results, isLoading, error, refetch } = useOrderSearch();

    return (
        <SafeAreaView style={styles.container}>
            <CustomInput
                isEnable
                placeholder={t('search.searchTrackingId')}
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
                    emptyTitle={t('search.noMatchingShipments')}
                    emptyMessage={t('search.checkTrackingId')}
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
