// HomeHeader — greeting, real device location (reverse-geocoded, not a
// hardcoded "Hyderabad, TS"), search, notifications, profile entry.
//
// Location was previously a static "Hyderabad, TS" pill that did nothing
// on tap — in a logistics app "where am I" is the first question a
// customer needs answered, so this now actually calls the device GPS
// (useAutoAddress, the same hook CheckRate.tsx already uses) and shows a
// real address, with its own loading/retry state independent of the rest
// of the screen — a GPS failure here shouldn't block booking.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform, Animated, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { MapPin, Bell, Search, QrCode, Users, MessageCircle, Zap, ChevronRight, RotateCw } from 'lucide-react-native';
import { useAutoAddress } from '@location/useAutoAddress';
import { HomeColors, HomeFonts, SPACING } from './theme';

// Free, license-free (Pixabay Content License — no attribution required),
// verified-working (200 OK, image/png, real alpha transparency) delivery
// truck silhouette — used as a tinted decorative accent, not a fabricated
// "photo" of any real vehicle or brand: https://pixabay.com/vectors/vans-delivery-trucks-automobile-5572117/
const TRUCK_ILLUSTRATION_URL = 'https://cdn.pixabay.com/photo/2020/09/14/20/39/vans-5572117_1280.png';

interface Props {
    userName: string;
    notifCount: number;
    searchText: string;
    onSearchChange: (t: string) => void;
    onSubmitSearch: () => void;
    onOpenProfile: () => void;
    onOpenInbox: () => void;
    onOpenNotifications: () => void;
    onOpenQrScan: () => void;
    colors: HomeColors;
    fonts: HomeFonts;
    // Plain React Native Animated.Value refs from Home.tsx (not
    // Reanimated shared values) — this file's <Animated.View> must stay
    // the classic 'react-native' import to match, or interpolate() output
    // fails to resolve (was crashing with "Transform with key of 'rotate'
    // must be a string" when this imported Animated from
    // 'react-native-reanimated' instead).
    fadeAnim: Animated.Value;
    headerScale: Animated.Value;
    bellShake: Animated.Value;
}

const HomeHeader: React.FC<Props> = ({
    userName, notifCount, searchText, onSearchChange, onSubmitSearch,
    onOpenProfile, onOpenInbox, onOpenNotifications, onOpenQrScan,
    colors: COLORS, fonts: FONTS, fadeAnim, headerScale, bellShake,
}) => {
    const styles = React.useMemo(() => makeStyles(COLORS, FONTS), [COLORS, FONTS]);
    const { getAddress } = useAutoAddress();
    const [address, setAddress] = useState<string | null>(null);
    const [locating, setLocating] = useState(true);
    const [locationFailed, setLocationFailed] = useState(false);

    const fetchLocation = React.useCallback(() => {
        setLocating(true);
        setLocationFailed(false);
        const timeout = setTimeout(() => {
            // useAutoAddress has no failure callback wired to the caller —
            // if nothing comes back in a reasonable window, show a real
            // retry affordance rather than spinning forever.
            setLocating((current) => {
                if (current) setLocationFailed(true);
                return false;
            });
        }, 12000);
        getAddress((addr) => {
            clearTimeout(timeout);
            setAddress(addr);
            setLocating(false);
        });
    }, [getAddress]);

    useEffect(() => {
        fetchLocation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: headerScale }] }}>
            <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.header}>
                <View style={styles.deco1} />
                <View style={styles.deco2} />
                <Image
                    source={{ uri: TRUCK_ILLUSTRATION_URL }}
                    resizeMode="contain"
                    style={styles.truckDeco}
                />

                <View style={styles.brandRow}>
                    <View style={styles.brandLeft}>
                        <View style={styles.brandMark}>
                            <Text style={styles.brandMarkText}>K</Text>
                        </View>
                        <View>
                            <View style={styles.brandNameRow}>
                                <Text style={styles.brandName}>Kalanabha</Text>
                                <View style={styles.fleetBadge}>
                                    <Text style={styles.fleetBadgeText}>FLEET</Text>
                                </View>
                            </View>
                            <Text style={styles.brandSubtitle}>Home</Text>
                        </View>
                    </View>
                    <Pressable style={styles.profileAvatar} onPress={onOpenProfile}>
                        <Users size={18} color="#fff" />
                    </Pressable>
                </View>

                <View style={styles.topRow}>
                    <Pressable style={styles.locationPill} onPress={fetchLocation} disabled={locating}>
                        {locating ? (
                            <RotateCw size={14} color="#F1F5F9" />
                        ) : (
                            <MapPin size={16} color="#F1F5F9" />
                        )}
                        <Text style={styles.cityText} numberOfLines={1}>
                            {locating ? 'Finding your location…' : locationFailed ? 'Tap to set location' : (address ?? 'Tap to set location')}
                        </Text>
                        <ChevronRight size={16} color="#CBD5E1" />
                    </Pressable>

                    <View style={styles.headerActions}>
                        <Pressable style={styles.notifBtn} onPress={onOpenInbox}>
                            <MessageCircle size={20} color="#F1F5F9" />
                        </Pressable>

                        <Animated.View style={{
                            transform: [{
                                rotate: bellShake.interpolate({ inputRange: [-12, 12], outputRange: ['-12deg', '12deg'] }),
                            }],
                        }}>
                            <Pressable style={styles.notifBtn} onPress={onOpenNotifications}>
                                <Bell size={20} color="#F1F5F9" />
                                {notifCount > 0 && (
                                    <View style={styles.notifBadge}>
                                        <Text style={styles.notifBadgeText}>{notifCount > 9 ? '9+' : notifCount}</Text>
                                    </View>
                                )}
                            </Pressable>
                        </Animated.View>
                    </View>
                </View>

                <View style={styles.dispatchCaptionRow}>
                    <Zap size={12} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.dispatchCaptionText}>FAST DISPATCH</Text>
                    <View style={styles.dispatchCaptionDot} />
                    <Text style={styles.dispatchCaptionText}>Real-Time Transit</Text>
                </View>

                <View style={styles.greeting}>
                    <Text style={styles.greetingText}>{getGreeting()}, {userName}!</Text>
                    <Text style={styles.greetingSub}>Where would you like to deliver today?</Text>
                </View>

                <View style={styles.searchContainer}>
                    <Search size={18} color={COLORS.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search tracking ID or order..."
                        placeholderTextColor={COLORS.textLight}
                        value={searchText}
                        onChangeText={onSearchChange}
                        onSubmitEditing={onSubmitSearch}
                        returnKeyType="search"
                    />
                    <Pressable style={styles.qrBtn} onPress={onOpenQrScan}>
                        <QrCode size={18} color={COLORS.primary} />
                    </Pressable>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

export default HomeHeader;

const makeStyles = (COLORS: HomeColors, FONTS: HomeFonts) => StyleSheet.create({
    header: {
        paddingHorizontal: SPACING.xl,
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 32,
        position: 'relative',
        overflow: 'hidden',
    },
    deco1: { position: 'absolute', top: -60, right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.08)' },
    deco2: { position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)' },
    // Tinted decorative illustration, not a photo of any real vehicle/brand
    // — a free (Pixabay, no-attribution) truck silhouette recolored to the
    // header's own palette via tintColor, sitting low-opacity behind the
    // real content so it reads as texture rather than a competing image.
    truckDeco: {
        position: 'absolute', bottom: -8, right: -18, width: 190, height: 100,
        opacity: 0.16, tintColor: '#fff',
    },
    brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    brandMark: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    brandMarkText: { color: '#fff', fontSize: 16, fontFamily: FONTS.BOLD_PRIMARY },
    brandNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    brandName: { color: '#fff', fontSize: 15, fontFamily: FONTS.BOLD_PRIMARY },
    fleetBadge: { backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    fleetBadgeText: { color: COLORS.primaryDark, fontSize: 9, fontFamily: FONTS.BOLD_PRIMARY, letterSpacing: 0.3 },
    brandSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: FONTS.PRIMARY, marginTop: 1 },
    profileAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    dispatchCaptionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    dispatchCaptionText: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: FONTS.BOLD_PRIMARY, letterSpacing: 0.4, textTransform: 'uppercase' },
    dispatchCaptionDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.6)' },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    locationPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 24, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginRight: 40, maxWidth: '68%' },
    cityText: { color: '#F1F5F9', fontSize: 13, fontFamily: FONTS.PRIMARY, flexShrink: 1 },
    headerActions: { flexDirection: 'row', gap: 10 },
    notifBtn: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
    notifBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: COLORS.danger, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.gradientEnd },
    notifBadgeText: { color: 'white', fontSize: 10, fontFamily: FONTS.PRIMARY },
    greeting: { marginBottom: 20 },
    greetingText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: FONTS.PRIMARY, marginBottom: 4 },
    greetingSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: FONTS.PRIMARY },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 16, height: 52, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontFamily: FONTS.PRIMARY, color: COLORS.textPrimary },
    qrBtn: { padding: 6, marginLeft: 4 },
});
