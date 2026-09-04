// FuelStationsScreen.tsx — Driver
//
// Two real backend features wired together: GET /maps/fuel-stations (free
// OpenStreetMap/Overpass POI data — no Google Places key anywhere in this
// project) finds nearby petrol bunks from the driver's current location;
// tapping "Log fill-up" on one submits a real POST /fuel-expenses so admin
// can see where/how much this driver spends on fuel (GET /fuel-expenses
// + the per-driver summary, both admin-only).
import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Fuel, MapPin, Navigation } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';
import { useNearbyFuelStations } from '@features/maps/hooks';
import { useLogFuelExpense } from '@features/fuelExpenses/hooks';
import type { FuelStation } from '@features/maps/types';
import AppTextInput from '../../components/ui/AppTextInput';
import AppButton from '../../components/ui/AppButton';
import { showToast } from '@ui/alert/toastStore';

const FuelStationsScreen = () => {
    const navigation = useNavigation();
    const { colors, fonts, spacing, radius } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts, spacing, radius), [colors, fonts, spacing, radius]);

    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    useEffect(() => {
        Geolocation.getCurrentPosition(
            (position) => setCoords({ lat: position.coords.latitude, lng: position.coords.longitude }),
            () => setLocationError('Unable to get your current location'),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000, forceRequestLocation: true },
        );
    }, []);

    const { data: stations, isLoading, error, refetch } = useNearbyFuelStations(coords?.lat ?? null, coords?.lng ?? null);
    const [loggingFor, setLoggingFor] = useState<FuelStation | null>(null);

    return (
        <View style={styles.root}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.BACKGROUND} />
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
                    <ArrowLeft color={colors.TEXT_PRIMARY} size={22} />
                </Pressable>
                <Text style={styles.headerTitle}>Nearby Fuel Stations</Text>
                <View style={{ width: 40 }} />
            </View>

            {loggingFor ? (
                <LogFuelForm
                    station={loggingFor}
                    onDone={() => setLoggingFor(null)}
                    styles={styles}
                    colors={colors}
                />
            ) : locationError ? (
                <View style={styles.centerState}>
                    <MapPin color={colors.GRAY} size={40} />
                    <Text style={styles.emptyText}>{locationError}</Text>
                </View>
            ) : isLoading || !coords ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color={colors.PRIMARY} />
                    <Text style={styles.emptyText}>Finding fuel stations near you…</Text>
                </View>
            ) : error ? (
                <View style={styles.centerState}>
                    <Text style={styles.emptyText}>Map data source is unavailable right now</Text>
                    <Pressable onPress={() => refetch()} style={styles.retryBtn}>
                        <Text style={styles.retryText}>Retry</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={stations ?? []}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.stationCard}>
                            <View style={styles.stationIconWrap}>
                                <Fuel color={colors.PRIMARY} size={20} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.stationName}>{item.name}</Text>
                                <View style={styles.stationMetaRow}>
                                    <Navigation color={colors.TEXT_SECONDARY} size={12} />
                                    <Text style={styles.stationMeta}>{item.distanceKm} km away</Text>
                                </View>
                            </View>
                            <Pressable style={styles.logBtn} onPress={() => setLoggingFor(item)}>
                                <Text style={styles.logBtnText}>Log fill-up</Text>
                            </Pressable>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.centerState}>
                            <Text style={styles.emptyText}>No fuel stations found nearby</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

export default FuelStationsScreen;

// Inline form rather than a separate screen — logging a fill-up is a
// quick, 2-field action (amount + optional litres), not a whole new
// navigation stack entry.
const LogFuelForm = ({
    station,
    onDone,
    styles,
    colors,
}: {
    station: FuelStation;
    onDone: () => void;
    styles: ReturnType<typeof makeStyles>;
    colors: ReturnType<typeof useAppTheme>['colors'];
}) => {
    const [amount, setAmount] = useState('');
    const [litres, setLitres] = useState('');
    const { mutate, isPending } = useLogFuelExpense();

    const handleSubmit = () => {
        const amountNum = Number(amount);
        if (!amountNum || amountNum <= 0) {
            showToast('Enter a valid amount', 'error');
            return;
        }
        mutate(
            {
                stationName: station.name,
                lat: station.lat,
                lng: station.lng,
                amount: amountNum,
                litres: litres ? Number(litres) : undefined,
            },
            {
                onSuccess: () => {
                    showToast('Fuel expense logged', 'success');
                    onDone();
                },
                onError: () => showToast('Could not log this expense — try again', 'error'),
            },
        );
    };

    return (
        <View style={styles.formCard}>
            <Text style={styles.formStation}>{station.name}</Text>
            <Text style={styles.formStationSub}>{station.distanceKm} km away</Text>

            <AppTextInput label="Amount paid (₹)" value={amount} onChange={setAmount} keyboardType="numeric" placeholder="e.g. 850" />
            <AppTextInput label="Litres (optional)" value={litres} onChange={setLitres} keyboardType="numeric" placeholder="e.g. 8.5" />

            <View style={styles.formActions}>
                <Pressable style={styles.cancelBtn} onPress={onDone}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                    <AppButton title={isPending ? 'Saving…' : 'Save'} onPress={handleSubmit} loading={isPending} disabled={isPending} />
                </View>
            </View>
        </View>
    );
};

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    spacing: ReturnType<typeof useAppTheme>['spacing'],
    radius: ReturnType<typeof useAppTheme>['radius'],
) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.BACKGROUND },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: 50,
        paddingBottom: spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.SURFACE,
        borderWidth: 1,
        borderColor: colors.BORDER,
    },
    headerTitle: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 16, color: colors.TEXT_PRIMARY },

    centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
    emptyText: { fontFamily: fonts.MEDIUM_PRIMARY, fontSize: 14, color: colors.TEXT_SECONDARY, textAlign: 'center' },
    retryBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.PRIMARY_LIGHT, borderRadius: radius.md },
    retryText: { fontFamily: fonts.SEMI_BOLD_PRIMARY, color: colors.PRIMARY, fontSize: 13 },

    list: { padding: spacing.lg, gap: spacing.sm },
    stationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.SURFACE,
        borderRadius: radius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.BORDER,
    },
    stationIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: colors.PRIMARY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stationName: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 14, color: colors.TEXT_PRIMARY },
    stationMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    stationMeta: { fontFamily: fonts.PRIMARY, fontSize: 12, color: colors.TEXT_SECONDARY },
    logBtn: { backgroundColor: colors.PRIMARY, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm - 2 },
    logBtnText: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 12, color: '#fff' },

    formCard: { flex: 1, padding: spacing.xl, gap: spacing.md },
    formStation: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 18, color: colors.TEXT_PRIMARY },
    formStationSub: { fontFamily: fonts.PRIMARY, fontSize: 13, color: colors.TEXT_SECONDARY, marginBottom: spacing.sm },
    formActions: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', marginTop: spacing.md },
    cancelBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    cancelBtnText: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 14, color: colors.TEXT_SECONDARY },
});
