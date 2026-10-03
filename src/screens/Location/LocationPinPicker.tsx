







import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Map, Camera, type LngLat, type ViewStateChangeEvent } from '@maplibre/maplibre-react-native';
import { ArrowLeft, Check, Clock, Locate, MapPin, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@theme/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import { reverseGeocode, forwardGeocode } from '@services/location';
import Geolocation from 'react-native-geolocation-service';
import { ensureLocationPermission } from '@utils/locationPermission';
import { recordRecentPin, useRecentPins } from '@features/location/useRecentPins';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const REVERSE_GEOCODE_DEBOUNCE_MS = 600;

type NavProp = NativeStackNavigationProp<RootStackParamList, 'LocationPinPicker'>;

const LocationPinPicker: React.FC = () => {
    const navigation = useNavigation<NavProp>();
    const route = useRoute<any>();
    const { colors, fonts, spacing, radius } = useAppTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const styles = React.useMemo(() => makeStyles(colors, fonts, spacing, radius, insets), [colors, fonts, spacing, radius, insets]);

    const initial: LngLat = route.params?.initial
        ? [route.params.initial.lng, route.params.initial.lat]
        : [78.4867, 17.385]; 
    const onConfirm: (point: { lat: number; lng: number; address: string }) => void = route.params?.onConfirm ?? (() => {});

    const [center, setCenter] = useState<LngLat>(initial);
    const [zoom, setZoom] = useState(16);
    const [address, setAddress] = useState<string>(route.params?.initialAddress ?? '');
    const [resolving, setResolving] = useState(false);
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { recentPins, refresh: refreshRecentPins } = useRecentPins();

    const resolveAddress = useCallback((lng: number, lat: number) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setResolving(true);
            try {
                const result = await reverseGeocode(lat, lng);
                setAddress(result);
            } catch {
                // Keep whatever address was last resolved — a transient
                // geocode failure shouldn't blank out a location the user
                
            } finally {
                setResolving(false);
            }
        }, REVERSE_GEOCODE_DEBOUNCE_MS);
    }, []);

    const handleRegionDidChange = useCallback(
        (event: { nativeEvent: ViewStateChangeEvent }) => {
            const [lng, lat] = event.nativeEvent.center;
            setCenter([lng, lat]);
            setZoom(event.nativeEvent.zoom);
            setSearchFocused(false);
            resolveAddress(lng, lat);
        },
        [resolveAddress],
    );

    const handleSearch = async () => {
        if (!query.trim()) return;
        setSearching(true);
        const result = await forwardGeocode(query.trim());
        setSearching(false);
        setSearchFocused(false);
        if (result) {
            setCenter([result.lng, result.lat]);
            resolveAddress(result.lng, result.lat);
        }
    };

    const handleSelectRecent = (pin: { lat: number; lng: number; address: string }) => {
        setCenter([pin.lng, pin.lat]);
        setAddress(pin.address);
        setSearchFocused(false);
        setQuery('');
    };

    const handleUseCurrentLocation = async () => {
        const granted = await ensureLocationPermission();
        if (!granted) return;
        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCenter([longitude, latitude]);
                resolveAddress(longitude, latitude);
            },
            () => { /* silent — same tolerance as useAutoAddress for a denied/failed GPS fix */ },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
        );
    };

    const handleConfirm = () => {
        const point = { lat: center[1], lng: center[0], address };
        recordRecentPin(point);
        refreshRecentPins();
        onConfirm(point);
        navigation.goBack();
    };

    return (
        <View style={styles.root}>
            <Map style={styles.map} mapStyle={MAP_STYLE_URL} onRegionDidChange={handleRegionDidChange}>
                <Camera center={center} zoom={zoom} />
            </Map>

            {/* Fixed pin, screen-centered — the map pans underneath it, so
                whatever the pin points at is always the exact map center. */}
            <View style={styles.pinWrap} pointerEvents="none">
                <MapPin size={36} color={colors.PRIMARY} fill={colors.PRIMARY_LIGHT} strokeWidth={2} />
            </View>

            <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
                    <ArrowLeft color={colors.TEXT_PRIMARY} size={20} />
                </Pressable>
                <View style={{ flex: 1 }}>
                    <View style={styles.searchBar}>
                        <Search size={16} color={colors.TEXT_SECONDARY} />
                        <TextInput
                            style={styles.searchInput}
                            value={query}
                            onChangeText={setQuery}
                            placeholder={t('locationPicker.searchPlaceholder')}
                            placeholderTextColor={colors.GRAY}
                            onSubmitEditing={handleSearch}
                            onFocus={() => setSearchFocused(true)}
                            returnKeyType="search"
                        />
                        {searching && <ActivityIndicator size="small" color={colors.PRIMARY} />}
                    </View>

                    {searchFocused && !query.trim() && recentPins.length > 0 && (
                        <View style={styles.recentsPanel}>
                            {recentPins.map((pin, i) => (
                                <Pressable key={`${pin.lat}-${pin.lng}-${i}`} style={styles.recentRow} onPress={() => handleSelectRecent(pin)}>
                                    <Clock size={14} color={colors.TEXT_SECONDARY} />
                                    <Text style={styles.recentText} numberOfLines={1}>{pin.address}</Text>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </View>
            </View>

            <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + spacing.lg }]}>
                <View style={styles.addressRow}>
                    <MapPin size={16} color={colors.PRIMARY} />
                    {resolving ? (
                        <Text style={styles.resolvingText}>{t('locationPicker.locating')}</Text>
                    ) : (
                        <Text style={styles.addressText} numberOfLines={2}>{address || t('locationPicker.panToSelect')}</Text>
                    )}
                </View>

                <View style={styles.actionsRow}>
                    <Pressable style={styles.currentLocationBtn} onPress={handleUseCurrentLocation}>
                        <Locate size={16} color={colors.PRIMARY} />
                        <Text style={styles.currentLocationText}>{t('locationPicker.useCurrentLocation')}</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.confirmBtn, (!address || resolving) && styles.confirmBtnDisabled]}
                        disabled={!address || resolving}
                        onPress={handleConfirm}
                    >
                        <Check size={16} color="#fff" />
                        <Text style={styles.confirmBtnText}>{t('locationPicker.confirmLocation')}</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

export default LocationPinPicker;

const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    spacing: ReturnType<typeof useAppTheme>['spacing'],
    radius: ReturnType<typeof useAppTheme>['radius'],
    insets: { top: number; bottom: number },
) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.BACKGROUND },
    map: { flex: 1 },
    pinWrap: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -18,
        marginTop: -36,
        alignItems: 'center',
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.SURFACE,
        borderWidth: 1, borderColor: colors.BORDER,
        ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 3 } }),
    },
    searchBar: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: colors.SURFACE, borderRadius: radius.lg,
        paddingHorizontal: spacing.md, height: 44,
        borderWidth: 1, borderColor: colors.BORDER,
        ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 3 } }),
    },
    searchInput: { flex: 1, fontFamily: fonts.PRIMARY, fontSize: 14, color: colors.TEXT_PRIMARY },
    recentsPanel: {
        marginTop: 6,
        backgroundColor: colors.SURFACE,
        borderRadius: radius.lg,
        borderWidth: 1, borderColor: colors.BORDER,
        overflow: 'hidden',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 3 } }),
    },
    recentRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: spacing.md, paddingVertical: 11,
        borderBottomWidth: 1, borderBottomColor: colors.BORDER,
    },
    recentText: { flex: 1, fontFamily: fonts.PRIMARY, fontSize: 13, color: colors.TEXT_PRIMARY },

    bottomSheet: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: colors.SURFACE,
        borderTopLeftRadius: radius.lg + 6,
        borderTopRightRadius: radius.lg + 6,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } }, android: { elevation: 8 } }),
    },
    addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: spacing.md },
    addressText: { flex: 1, fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 13.5, color: colors.TEXT_PRIMARY, lineHeight: 18 },
    resolvingText: { flex: 1, fontFamily: fonts.PRIMARY, fontSize: 13, color: colors.TEXT_SECONDARY, fontStyle: 'italic' },

    actionsRow: { flexDirection: 'row', gap: spacing.sm },
    currentLocationBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: spacing.md, height: 46,
        borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.BORDER,
    },
    currentLocationText: { fontFamily: fonts.SEMI_BOLD_PRIMARY, fontSize: 13, color: colors.PRIMARY },
    confirmBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 46, borderRadius: radius.md, backgroundColor: colors.PRIMARY,
    },
    confirmBtnDisabled: { opacity: 0.5 },
    confirmBtnText: { fontFamily: fonts.BOLD_PRIMARY, fontSize: 14, color: '#fff' },
});
