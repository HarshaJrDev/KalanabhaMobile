
import React, {
    useState,
    useRef,
    useCallback,
    useEffect,
    useMemo,
} from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Switch,
    Modal,
    ActivityIndicator,
    Pressable,
    Alert,
    Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
    ChevronLeft,
    User,
    Phone,
    MapPin,
    Mail,
    Package as PackageIcon,
    Weight,
    Ruler,
    AlertTriangle,
    FileText,
    Truck,
    CheckCircle,
    Edit3,
    ArrowRight,
    ArrowLeft,
    Navigation,
    Send,
    Package,
    CircleCheck,
    Bike,
    Car,
    CreditCard,
    Banknote,
    Landmark,
    Check,
    Search,
    Smartphone,
    Shirt,
    UtensilsCrossed,
    Sofa,
    Pill,
    type LucideIcon,
} from 'lucide-react-native';
import { registerFCMToken, setupFCMListeners } from '@utils/cm';
import { useVehicleConfigs, useServiceAreas, useBusinessSettings, usePackageCategories } from '@features/settings/hooks';
import { useAuthStore } from '@features/store/authStore';
import type { ServiceArea } from '@features/settings/types';
import VehicleVisual from '@components/VehicleVisual';
import { useFareEstimate, FareEstimate, type KnownCoords } from '@location/useFareEstimate';
import { forwardGeocode } from '@services/location';
import { createShipment } from '@features/shipments/api/shipments.api';
import { safeNumber } from '@utils/parsers';
import { normalizeError } from '@utils/error';
import { useAppTheme } from '@theme/ThemeContext';

// Rebranded from a generic blue palette to Kalanabha's own orange identity
// (§4/§7) — every key here is unchanged so the rest of this file (which
// reads COLORS.* throughout) didn't need touching. Built from
// useAppTheme() inside each sub-component below (see makeOrderColors)
// rather than a module-level constant, so it flips with dark mode without
// threading props through every step component.
const makeOrderColors = (BRAND: ReturnType<typeof useAppTheme>['colors']) => ({
    primary: BRAND.PRIMARY,
    primaryDark: BRAND.PRIMARY_DARK,
    primaryLight: BRAND.PRIMARY_LIGHT,
    success: BRAND.SUCCESS,
    successLight: '#F0FDF4',
    warning: BRAND.WARNING,
    warningLight: '#FFFBEB',
    danger: BRAND.ERROR,
    dangerLight: '#FEF2F2',
    text: BRAND.TEXT_PRIMARY,
    textSecondary: BRAND.TEXT_SECONDARY,
    textMuted: BRAND.GRAY,
    border: BRAND.BORDER,
    borderFocus: BRAND.PRIMARY,
    bg: BRAND.BACKGROUND,
    surface: BRAND.SURFACE,
    placeholder: '#C4CACD',
});
type OrderColors = ReturnType<typeof makeOrderColors>;

const RADIUS = { sm: 8, md: 12, lg: 16, xl: 22, full: 999 };

const isSend = Send
const isPackage = Package
const isCircleCheck = CircleCheck
const isUser = User

// ─── TYPES ────────────────────────────────────────────────────────────────────

type SenderForm = {
    name: string;
    phone: string;
    email: string;
    // House no./landmark — free text, appended onto the selected place's
    // name for the driver's benefit. The place itself (city/pincode/real
    // coordinates) always comes from the service-area dropdown, never typed.
    landmark: string;
    address: string;
    city: string;
    pincode: string;
};

type ReceiverForm = {
    name: string;
    phone: string;
    email: string;
    landmark: string;
    address: string;
    city: string;
    pincode: string;
};

type PackageForm = {
    description: string;
    weight: string;
    length: string;
    width: string;
    height: string;
    quantity: string;
    fragile: boolean;
    insurance: boolean;
    category: string;
    price: number;
    // House Shifting only — real per-helper charge (business setting
    // 'helper_rate_per_person') is applied server-side per this count.
    helpersCount: number;
};

type OrderDetailsForm = {
    serviceType: 'standard' | 'express' | 'same-day';
    // Not a fixed union any more — real VehicleConfig rows (admin-managed),
    // so a type the admin renames/adds/deactivates is picked up here without
    // a mobile release. See VEHICLE_ICON_BY_NAME below for the icon mapping.
    vehicleType: string;
    paymentMode: 'prepaid' | 'cod' | 'credit';
    notes: string;
    pickupDate: string;
    pickupSlot: string;
};

type AllOrderData = {
    sender: SenderForm;
    receiver: ReceiverForm;
    package: PackageForm;
    orderDetails: OrderDetailsForm;
};

const log = (scope: string, message: string, data?: unknown) => {
    // Avoid noisy logs in production
    if (__DEV__) {
        console.log(`[${scope}] ${message}`, data ?? '');
    }
};

const logError = (scope: string, error: unknown) => {
    if (__DEV__) {
        console.error(`[${scope}] ERROR`, error);
    }
};


// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STEPS = [
    {
        label: 'Category',
        icon: <Truck size={24} color="#FF7518" />,
        description: 'What are you sending?'
    },
    {
        label: 'Sender',
        icon: <User size={24} color="#FF7518" />,
        description: "Sender's details"
    },
    {
        label: 'Receiver',
        icon: <Send size={24} color="#FF7518" />,
        description: "Receiver's details"
    },
    {
        label: 'Package',
        icon: <Package size={24} color="#FF7518" />,
        description: 'Package info'
    },
    {
        label: 'Review',
        icon: <CircleCheck size={24} color="#FF7518" />,
        description: 'Review & confirm'
    },
];

// Real, admin-managed categories now (GET /settings/package-categories) —
// was a frozen client array before. `icon` on each real category is a
// lucide-react-native component name the admin sets in KalanabhaAdmin;
// packageCategoryIconFor resolves it defensively (an admin could type a
// name that doesn't exist) to the generic Package icon rather than
// crashing or rendering nothing.
const PACKAGE_CATEGORY_ICONS: Record<string, LucideIcon> = {
    FileText, Smartphone, Shirt, UtensilsCrossed, Sofa, Pill, Package,
};
const packageCategoryIconFor = (icon: string): LucideIcon => PACKAGE_CATEGORY_ICONS[icon] ?? Package;

// Real, admin-set surcharges (GET /settings/business — same
// 'service_type_express_surcharge'/'service_type_same_day_surcharge'
// keys PricingService.quote() now actually adds to the price) — this
// used to show a fixed ₹99/₹199/₹349 regardless of what selecting a
// service type actually changed about the price (nothing; the backend
// silently ignored serviceType entirely). Standard carries no
// surcharge, so it reads "Included" rather than inventing a base fee
// that was never really its own line item.
const makeServiceTypes = (
    COLORS: OrderColors,
    expressSurcharge: number,
    sameDaySurcharge: number,
): { key: OrderDetailsForm['serviceType']; label: string; desc: string; priceLabel: string; days: string; color: string }[] => [
    { key: 'standard', label: 'Standard', desc: 'Reliable delivery', priceLabel: 'Included', days: '3-5 days', color: COLORS.textSecondary },
    { key: 'express', label: 'Express', desc: 'Faster delivery', priceLabel: `+₹${expressSurcharge}`, days: '1-2 days', color: COLORS.primary },
    { key: 'same-day', label: 'Same Day', desc: 'Deliver today', priceLabel: `+₹${sameDaySurcharge}`, days: 'Today', color: COLORS.success },
];

// VehicleConfig.icon is a free-text string set by whichever admin created
// the row (seen values: "Bike"/"Van"/"Truck"), not a Lucide icon key — maps
// the real config's `name` to a matching glyph. Same mapping as Home.tsx.
const VEHICLE_ICON_BY_NAME: Record<string, LucideIcon> = {
    bike: Bike,
    van: Car,
    truck: Truck,
};
const vehicleIconFor = (name: string): LucideIcon => VEHICLE_ICON_BY_NAME[name.toLowerCase()] ?? Truck;

const PAYMENT_MODES: { key: OrderDetailsForm['paymentMode']; label: string; icon: LucideIcon }[] = [
    { key: 'prepaid', label: 'Online / UPI', icon: CreditCard },
    { key: 'cod', label: 'Cash on Delivery', icon: Banknote },
    { key: 'credit', label: 'Credit Account', icon: Landmark },
];

const PICKUP_SLOTS = ['9:00 AM – 11:00 AM', '11:00 AM – 1:00 PM', '2:00 PM – 4:00 PM', '4:00 PM – 6:00 PM'];

// ─── INITIAL STATES ───────────────────────────────────────────────────────────

const INIT_SENDER: SenderForm = { name: '', phone: '', email: '', landmark: '', address: '', city: '', pincode: '' };
const INIT_RECEIVER: ReceiverForm = { name: '', phone: '', email: '', landmark: '', address: '', city: '', pincode: '' };
const INIT_PACKAGE: PackageForm = {
    description: '', weight: '', length: '', width: '', height: '',
    quantity: '1', fragile: false, insurance: false, category: 'Documents',
    price: 0, helpersCount: 1,
};
const INIT_ORDER: OrderDetailsForm = {
    serviceType: 'standard', vehicleType: 'bike',
    paymentMode: 'prepaid', notes: '', pickupDate: '', pickupSlot: PICKUP_SLOTS[0],
};

// ─── REUSABLE SUB-COMPONENTS ──────────────────────────────────────────────────

const InputField = ({
    label, value, onChangeText, placeholder, icon: Icon,
    keyboardType = 'default', error, secureTextEntry = false,
}: {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    icon?: any;
    keyboardType?: any;
    error?: string;
    secureTextEntry?: boolean;
}) => {
    const { colors: BRAND } = useAppTheme();
    const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
    const inputStyles = useMemo(() => makeInputStyles(COLORS), [COLORS]);
    const [focused, setFocused] = useState(false);
    return (
        <View style={inputStyles.wrapper}>
            <Text style={inputStyles.label}>{label}</Text>
            <View style={[
                inputStyles.row,
                focused && inputStyles.rowFocused,
                !!error && inputStyles.rowError,
            ]}>
                {Icon && <Icon color={focused ? COLORS.primary : COLORS.textMuted} width={16} height={16} style={inputStyles.icon} />}
                <TextInput
                    style={inputStyles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.placeholder}
                    keyboardType={keyboardType}
                    secureTextEntry={secureTextEntry}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    autoCapitalize="none"
                />
            </View>
            {error ? <Text style={inputStyles.error}>{error}</Text> : null}
        </View>
    );
};

const makeInputStyles = (COLORS: OrderColors) => StyleSheet.create({
    wrapper: { marginBottom: 14 },
    label: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 5, letterSpacing: 0.3 },
    row: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: COLORS.border,
        borderRadius: RADIUS.md, paddingHorizontal: 12, height: 48,
        backgroundColor: COLORS.surface,
    },
    rowFocused: { borderColor: COLORS.primary, backgroundColor: '#FAFCFF' },
    rowError: { borderColor: COLORS.danger },
    icon: { marginRight: 8 },
    input: { flex: 1, fontSize: 14, color: COLORS.text, height: '100%' },
    error: { color: COLORS.danger, fontSize: 11, marginTop: 3 },
});

// Dropdown picker over the admin-managed service areas (GET
// /settings/service-areas — KalanabhaAdmin's Service Areas page) — same
// visual language as InputField (label/row/error) so it reads as one form,
// just backed by a searchable modal instead of free text. Selecting an
// area hands back its real, known center coordinates; StepSender/
// StepReceiver then offer an optional OpenStreetMap search to refine that
// down to the customer's exact spot, falling back to the area's center if
// that search doesn't resolve — so pickup/drop coordinates always exist.
const PlacePicker = ({
    label, value, areas, onSelect, placeholder = 'Select a locality', error,
}: {
    label: string;
    value: ServiceArea | null;
    areas: ServiceArea[];
    onSelect: (place: ServiceArea) => void;
    placeholder?: string;
    error?: string;
}) => {
    const { colors: BRAND } = useAppTheme();
    const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
    const inputStyles = useMemo(() => makeInputStyles(COLORS), [COLORS]);
    const pickerStyles = useMemo(() => makePickerStyles(COLORS), [COLORS]);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = q
            ? areas.filter((p) => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q))
            : areas;
        const byCity: Record<string, ServiceArea[]> = {};
        list.forEach((p) => {
            byCity[p.city] = byCity[p.city] ?? [];
            byCity[p.city].push(p);
        });
        return byCity;
    }, [search, areas]);

    return (
        <View style={inputStyles.wrapper}>
            <Text style={inputStyles.label}>{label}</Text>
            <TouchableOpacity
                style={[inputStyles.row, !!error && inputStyles.rowError]}
                onPress={() => setOpen(true)}
                activeOpacity={0.7}
            >
                <MapPin color={value ? COLORS.primary : COLORS.textMuted} width={16} height={16} style={inputStyles.icon} />
                <Text
                    style={[inputStyles.input, { paddingVertical: 0 }, !value && { color: COLORS.placeholder }]}
                    numberOfLines={1}
                >
                    {value ? `${value.name}, ${value.city}` : placeholder}
                </Text>
                <ChevronLeft color={COLORS.textMuted} width={16} height={16} style={{ transform: [{ rotate: '-90deg' }] }} />
            </TouchableOpacity>
            {error ? <Text style={inputStyles.error}>{error}</Text> : null}

            <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
                <View style={pickerStyles.modalContainer}>
                    <View style={pickerStyles.modalHeader}>
                        <Text style={pickerStyles.modalTitle}>{label}</Text>
                        <TouchableOpacity onPress={() => setOpen(false)} style={pickerStyles.closeBtn}>
                            <Text style={pickerStyles.closeBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={pickerStyles.searchRow}>
                        <Search size={16} color={COLORS.textMuted} />
                        <TextInput
                            style={pickerStyles.searchInput}
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search locality or city"
                            placeholderTextColor={COLORS.placeholder}
                            autoFocus
                        />
                    </View>
                    <ScrollView keyboardShouldPersistTaps="handled">
                        {Object.keys(filtered).length === 0 && (
                            <Text style={pickerStyles.emptyText}>No matching locality</Text>
                        )}
                        {Object.entries(filtered).map(([city, places]) => (
                            <View key={city}>
                                <Text style={pickerStyles.cityLabel}>{city}</Text>
                                {places.map((p) => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={pickerStyles.placeRow}
                                        onPress={() => { onSelect(p); setOpen(false); setSearch(''); }}
                                    >
                                        <MapPin size={15} color={COLORS.primary} />
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={pickerStyles.placeName}>{p.name}</Text>
                                            <Text style={pickerStyles.placePincode}>{p.pincode}</Text>
                                        </View>
                                        {value?.id === p.id && <Check size={16} color={COLORS.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

const makePickerStyles = (COLORS: OrderColors) => StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: COLORS.bg },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface,
    },
    modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    closeBtn: { paddingHorizontal: 10, paddingVertical: 6 },
    closeBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
    searchRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        margin: 16, paddingHorizontal: 14, height: 46,
        backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
        borderWidth: 1.5, borderColor: COLORS.border,
    },
    searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
    cityLabel: {
        fontSize: 12, fontWeight: '700', color: COLORS.textMuted,
        letterSpacing: 0.4, textTransform: 'uppercase',
        paddingHorizontal: 20, marginTop: 14, marginBottom: 6,
    },
    placeRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    placeName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
    placePincode: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
    emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: 13 },
});

// Once a service area is picked, this optionally narrows it down to the
// customer's exact spot via a real OpenStreetMap (Nominatim) search,
// biased toward the chosen area's name/city. If the search comes up empty
// or fails, the area's own center coordinates keep working as the
// fallback (set by the caller before this ever renders a result) — this
// component only ever narrows the location, it never blocks on being
// left alone or on a failed lookup.
const LocationRefiner = ({ area, refined, onResolve }: {
    area: ServiceArea;
    refined: (KnownCoords & { label: string }) | null;
    onResolve: (result: (KnownCoords & { label: string }) | null) => void;
}) => {
    const { colors: BRAND } = useAppTheme();
    const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
    const refineStyles = useMemo(() => makeRefineStyles(COLORS), [COLORS]);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<'idle' | 'searching' | 'not-found'>('idle');

    const handleSearch = async () => {
        if (!query.trim()) return;
        setStatus('searching');
        const result = await forwardGeocode(`${query.trim()}, ${area.name}, ${area.city}`);
        if (result) {
            onResolve({ ...result, label: query.trim() });
            setStatus('idle');
        } else {
            onResolve(null);
            setStatus('not-found');
        }
    };

    return (
        <View style={refineStyles.wrapper}>
            <Text style={refineStyles.label}>Pinpoint exact location (optional)</Text>
            <Text style={refineStyles.hint}>Search a landmark within {area.name} — powered by OpenStreetMap</Text>
            <View style={refineStyles.row}>
                <Navigation size={15} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                    style={refineStyles.input}
                    value={query}
                    onChangeText={(v) => { setQuery(v); if (status !== 'idle') setStatus('idle'); }}
                    placeholder={`e.g. City Central Mall, ${area.name}`}
                    placeholderTextColor={COLORS.placeholder}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                <TouchableOpacity onPress={handleSearch} disabled={status === 'searching'} style={refineStyles.searchBtn}>
                    {status === 'searching'
                        ? <ActivityIndicator size="small" color={COLORS.primary} />
                        : <Search size={16} color={COLORS.primary} />}
                </TouchableOpacity>
            </View>
            {refined && (
                <View style={refineStyles.resultRow}>
                    <Check size={13} color={COLORS.success} />
                    <Text style={refineStyles.resultText} numberOfLines={1}>Pinpointed: {refined.label}</Text>
                    <TouchableOpacity onPress={() => { onResolve(null); setQuery(''); }}>
                        <Text style={refineStyles.resetText}>Reset</Text>
                    </TouchableOpacity>
                </View>
            )}
            {status === 'not-found' && (
                <Text style={refineStyles.notFoundText}>
                    Couldn't find that — we'll use {area.name}'s center for now, still accurate enough to book.
                </Text>
            )}
        </View>
    );
};

const makeRefineStyles = (COLORS: OrderColors) => StyleSheet.create({
    wrapper: { marginBottom: 14 },
    label: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 2 },
    hint: { fontSize: 11, color: COLORS.textMuted, marginBottom: 6 },
    row: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: COLORS.border,
        borderRadius: RADIUS.md, paddingHorizontal: 12, height: 46,
        backgroundColor: COLORS.surface,
    },
    input: { flex: 1, fontSize: 14, color: COLORS.text, height: '100%' },
    searchBtn: { padding: 6 },
    resultRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    resultText: { flex: 1, fontSize: 12, color: COLORS.success, fontWeight: '600' },
    resetText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
    notFoundText: { fontSize: 11, color: COLORS.warning, marginTop: 6, lineHeight: 15 },
});

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => {
    const { colors: BRAND } = useAppTheme();
    const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
    const shStyles = useMemo(() => makeShStyles(COLORS), [COLORS]);
    return (
        <View style={shStyles.wrapper}>
            <View style={shStyles.bar} />
            <View>
                <Text style={shStyles.title}>{title}</Text>
                {subtitle ? <Text style={shStyles.subtitle}>{subtitle}</Text> : null}
            </View>
        </View>
    );
};

const makeShStyles = (COLORS: OrderColors) => StyleSheet.create({
    wrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 4 },
    bar: { width: 4, height: 22, backgroundColor: COLORS.primary, borderRadius: 2, marginRight: 10 },
    title: { fontSize: 15, fontWeight: '700', color: COLORS.text },
    subtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
});

const NavButtons = ({
    onBack, onNext, nextLabel = 'Continue',
    loading = false, disabled = false, isFirst = false,
}: {
    onBack?: () => void;
    onNext: () => void;
    nextLabel?: string;
    loading?: boolean;
    disabled?: boolean;
    isFirst?: boolean;
}) => {
    const { colors: BRAND } = useAppTheme();
    const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
    const navStyles = useMemo(() => makeNavStyles(COLORS), [COLORS]);
    return (
        <View style={navStyles.row}>
            {!isFirst && (
                <TouchableOpacity style={navStyles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <ArrowLeft color={COLORS.primary} width={16} height={16} />
                    <Text style={navStyles.backText}>Back</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity
                style={[navStyles.nextBtn, isFirst && { flex: 1 }, disabled && navStyles.nextBtnDisabled]}
                onPress={onNext}
                activeOpacity={0.85}
                disabled={loading || disabled}
            >
                {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Text style={navStyles.nextText}>{nextLabel}</Text>
                        <ArrowRight color="#fff" width={16} height={16} />
                    </>
                }
            </TouchableOpacity>
        </View>
    );
};

const makeNavStyles = (COLORS: OrderColors) => StyleSheet.create({
    row: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 },
    backBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.md,
        paddingHorizontal: 20, height: 50,
    },
    backText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
    nextBtn: {
        flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 50,
    },
    nextBtnDisabled: { backgroundColor: COLORS.textMuted, opacity: 0.7 },
    nextText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ─── STEP 1: SENDER ───────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "123, MG Road" free-text style, but built from a real place instead —
// "<landmark>, <locality>, <city>" (landmark omitted if blank).
const composeAddress = (landmark: string, place: ServiceArea | null): string => {
    if (!place) return landmark.trim();
    return landmark.trim() ? `${landmark.trim()}, ${place.name}, ${place.city}` : `${place.name}, ${place.city}`;
};

// ─── STEP 0: CATEGORY ─────────────────────────────────────────────────────────

type ShipmentCategory = 'PARCEL' | 'HOUSE_SHIFTING';

// Real K-branded photos for the two booking categories, not stock/generic
// icons — one require() per category, read generically off CATEGORY_OPTIONS
// below rather than hardcoded per-card JSX.
const CATEGORY_IMAGES: Record<ShipmentCategory, ReturnType<typeof require>> = {
    PARCEL: require('../../../assets/images/home/category-package.png'),
    HOUSE_SHIFTING: require('../../../assets/images/home/category-house-shifting.png'),
};

const CATEGORY_OPTIONS: { key: ShipmentCategory; title: string; subtitle: string; icon: LucideIcon }[] = [
    { key: 'PARCEL', title: 'Send a Package', subtitle: 'Parcels, documents, goods — point to point', icon: Package },
    { key: 'HOUSE_SHIFTING', title: 'House Shifting', subtitle: 'Movers with loading/unloading help, van or truck', icon: Truck },
];

const StepCategory = ({ value, onSelect, onNext }: {
    value: ShipmentCategory;
    onSelect: (category: ShipmentCategory) => void;
    onNext: () => void;
}) => {
    const { colors: BRAND } = useAppTheme();
    const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
    const catStyles = useMemo(() => makeCategoryStyles(COLORS), [COLORS]);

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <SectionHeader title="What are you sending?" subtitle="Choose the kind of booking you need" />
            {CATEGORY_OPTIONS.map((opt) => {
                const selected = value === opt.key;
                return (
                    <TouchableOpacity
                        key={opt.key}
                        style={[catStyles.card, selected && catStyles.cardActive]}
                        onPress={() => onSelect(opt.key)}
                        activeOpacity={0.9}
                    >
                        <Image source={CATEGORY_IMAGES[opt.key]} resizeMode="cover" style={catStyles.image} />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.72)']}
                            style={catStyles.scrim}
                        />
                        <View style={catStyles.iconWrap}>
                            <opt.icon size={20} color="#fff" />
                        </View>
                        <View style={catStyles.textWrap}>
                            <Text style={catStyles.title}>{opt.title}</Text>
                            <Text style={catStyles.subtitle}>{opt.subtitle}</Text>
                        </View>
                        {selected && (
                            <View style={catStyles.checkBadge}>
                                <Check size={13} color="#fff" strokeWidth={3} />
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
            {value === 'HOUSE_SHIFTING' && (
                <View style={catStyles.infoBox}>
                    <AlertTriangle size={14} color={COLORS.warning} />
                    <Text style={catStyles.infoText}>
                        House Shifting only offers Van/Truck (no bike) and adds a real, admin-set per-helper charge — you'll see the exact number of helpers and rate before booking.
                    </Text>
                </View>
            )}
            <NavButtons onNext={onNext} isFirst />
        </ScrollView>
    );
};

const makeCategoryStyles = (COLORS: OrderColors) => StyleSheet.create({
    card: {
        height: 152, borderRadius: RADIUS.lg, overflow: 'hidden',
        marginBottom: 14, position: 'relative',
        borderWidth: 2, borderColor: 'transparent',
        backgroundColor: COLORS.surface,
    },
    cardActive: { borderColor: COLORS.primary },
    image: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
    scrim: { ...StyleSheet.absoluteFillObject },
    iconWrap: {
        position: 'absolute', top: 12, left: 12,
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.22)',
        alignItems: 'center', justifyContent: 'center',
    },
    textWrap: { position: 'absolute', left: 14, right: 14, bottom: 12 },
    title: { fontSize: 16, fontWeight: '800', color: '#fff' },
    subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 3, lineHeight: 16 },
    checkBadge: {
        position: 'absolute', top: 12, right: 12,
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    },
    infoBox: {
        flexDirection: 'row', gap: 8, alignItems: 'flex-start',
        backgroundColor: COLORS.warningLight, borderRadius: RADIUS.md,
        padding: 12, marginBottom: 8,
    },
    infoText: { flex: 1, fontSize: 12, color: COLORS.text, lineHeight: 17 },
});

const StepSender = ({
    data, onChange, areas, place, onSelectPlace, otherPlace, refined, onRefine, onNext, onBack,
}: {
    data: SenderForm;
    onChange: (key: keyof SenderForm, val: string) => void;
    areas: ServiceArea[];
    place: ServiceArea | null;
    onSelectPlace: (place: ServiceArea) => void;
    otherPlace: ServiceArea | null;
    refined: (KnownCoords & { label: string }) | null;
    onRefine: (result: (KnownCoords & { label: string }) | null) => void;
    onNext: () => void;
    onBack: () => void;
}) => {
    const [errors, setErrors] = useState<Partial<Record<keyof SenderForm | 'place', string>>>({});

    const validate = () => {
        const e: typeof errors = {};
        if (!data.name.trim()) e.name = 'Name is required';
        else if (data.name.trim().length < 2) e.name = 'Name is too short';
        if (!data.phone.trim()) e.phone = 'Phone number is required';
        else if (!/^\d{10}$/.test(data.phone.replace(/\D/g, '').slice(-10))) e.phone = 'Enter a valid 10-digit phone number';
        if (data.email.trim() && !EMAIL_RE.test(data.email.trim())) e.email = 'Enter a valid email address';
        if (!place) e.place = 'Select a pickup locality';
        else if (otherPlace && place.id === otherPlace.id) e.place = 'Pickup and drop can\'t be the same locality';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = () => { if (validate()) onNext(); };

    return (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <SectionHeader title="Sender Information" subtitle="Who is sending this package?" />

            <InputField label="Full Name *" value={data.name} onChangeText={v => onChange('name', v)}
                placeholder="e.g. Arjun Sharma" icon={User} error={errors.name} />
            <InputField label="Phone Number *" value={data.phone} onChangeText={v => onChange('phone', v)}
                placeholder="98765 43210" icon={Phone} keyboardType="phone-pad" error={errors.phone} />
            <InputField label="Email Address" value={data.email} onChangeText={v => onChange('email', v)}
                placeholder="arjun@example.com" icon={Mail} keyboardType="email-address" error={errors.email} />

            <SectionHeader title="Pickup Address" subtitle="Where should we pick it up?" />

            <PlacePicker
                label="Locality *"
                value={place}
                areas={areas}
                onSelect={onSelectPlace}
                placeholder="e.g. Banjara Hills, Hyderabad"
                error={errors.place}
            />
            {place && <LocationRefiner area={place} refined={refined} onResolve={onRefine} />}
            <InputField label="House / Flat No., Landmark" value={data.landmark} onChangeText={v => onChange('landmark', v)}
                placeholder="e.g. Flat 302, near City Central Mall" icon={MapPin} />

            <NavButtons onBack={onBack} onNext={handleNext} />
        </ScrollView>
    );
};

// ─── STEP 2: RECEIVER ─────────────────────────────────────────────────────────

const StepReceiver = ({
    data, onChange, areas, place, onSelectPlace, otherPlace, refined, onRefine, onNext, onBack,
}: {
    data: ReceiverForm;
    onChange: (key: keyof ReceiverForm, val: string) => void;
    areas: ServiceArea[];
    place: ServiceArea | null;
    onSelectPlace: (place: ServiceArea) => void;
    otherPlace: ServiceArea | null;
    refined: (KnownCoords & { label: string }) | null;
    onRefine: (result: (KnownCoords & { label: string }) | null) => void;
    onNext: () => void;
    onBack: () => void;
}) => {
    const [errors, setErrors] = useState<Partial<Record<keyof ReceiverForm | 'place', string>>>({});

    const validate = () => {
        const e: typeof errors = {};
        if (!data.name.trim()) e.name = 'Name is required';
        else if (data.name.trim().length < 2) e.name = 'Name is too short';
        if (!data.phone.trim()) e.phone = 'Phone number is required';
        else if (!/^\d{10}$/.test(data.phone.replace(/\D/g, '').slice(-10))) e.phone = 'Enter a valid 10-digit phone number';
        if (data.email.trim() && !EMAIL_RE.test(data.email.trim())) e.email = 'Enter a valid email address';
        if (!place) e.place = 'Select a delivery locality';
        else if (otherPlace && place.id === otherPlace.id) e.place = 'Pickup and drop can\'t be the same locality';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    return (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <SectionHeader title="Receiver Information" subtitle="Who receives this package?" />

            <InputField label="Full Name *" value={data.name} onChangeText={v => onChange('name', v)}
                placeholder="e.g. Priya Patel" icon={User} error={errors.name} />
            <InputField label="Phone Number *" value={data.phone} onChangeText={v => onChange('phone', v)}
                placeholder="87654 32100" icon={Phone} keyboardType="phone-pad" error={errors.phone} />
            <InputField label="Email Address" value={data.email} onChangeText={v => onChange('email', v)}
                placeholder="priya@example.com" icon={Mail} keyboardType="email-address" error={errors.email} />

            <SectionHeader title="Delivery Address" subtitle="Where should we deliver?" />

            <PlacePicker
                label="Locality *"
                value={place}
                areas={areas}
                onSelect={onSelectPlace}
                placeholder="e.g. Hanamkonda, Warangal"
                error={errors.place}
            />
            {place && <LocationRefiner area={place} refined={refined} onResolve={onRefine} />}
            <InputField label="House / Flat No., Landmark" value={data.landmark} onChangeText={v => onChange('landmark', v)}
                placeholder="e.g. Shop 12, opposite bus stand" icon={MapPin} />

            <NavButtons onBack={onBack} onNext={() => { if (validate()) onNext(); }} />
        </ScrollView>
    );
};

// ─── STEP 3: PACKAGE ──────────────────────────────────────────────────────────

const StepPackage = ({
    data, onChange, category, helperRate, onNext, onBack,
}: {
    data: PackageForm;
    onChange: <K extends keyof PackageForm>(key: K, val: PackageForm[K]) => void;
    category: ShipmentCategory;
    helperRate: number | null;
    onNext: () => void;
    onBack: () => void;
}) => {
    const { colors: BRAND } = useAppTheme();
    const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
    const pkgStyles = useMemo(() => makePkgStyles(COLORS), [COLORS]);
    const [errors, setErrors] = useState<Partial<Record<keyof PackageForm, string>>>({});
    const isHouseShifting = category === 'HOUSE_SHIFTING';
    const { data: packageCategoriesData } = usePackageCategories();
    const packageCategories = useMemo(
        () => (packageCategoriesData ?? []).filter((c) => c.active),
        [packageCategoriesData],
    );

    const validate = () => {
        const e: typeof errors = {};
        if (!data.description.trim()) e.description = 'Description is required';
        else if (data.description.trim().length < 3) e.description = 'Description is too short';

        if (isHouseShifting) {
            if (!Number.isInteger(data.helpersCount) || data.helpersCount < 1 || data.helpersCount > 4) {
                e.helpersCount = 'Choose between 1 and 4 helpers' as any;
            }
        } else {
            const weight = Number(data.weight);
            if (!data.weight.trim() || isNaN(weight) || weight <= 0) e.weight = 'Enter a weight greater than 0';
            else if (weight > 5000) e.weight = 'Exceeds the largest vehicle\'s 5000 kg limit';

            const quantity = Number(data.quantity);
            if (!data.quantity.trim() || !Number.isInteger(quantity) || quantity < 1) e.quantity = 'Quantity must be a whole number ≥ 1';

            // Dimensions are optional, but a garbage/negative value if entered
            // at all is still worth catching before it reaches the backend.
            (['length', 'width', 'height'] as const).forEach((dim) => {
                if (!data[dim].trim()) return;
                const v = Number(data[dim]);
                if (isNaN(v) || v <= 0) e[dim] = 'Must be greater than 0';
            });
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    return (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <SectionHeader
                title={isHouseShifting ? 'Move Details' : 'Package Details'}
                subtitle={isHouseShifting ? 'Tell us about your move' : 'Tell us about your shipment'}
            />

            {!isHouseShifting && (
                <>
                    {/* Category chips */}
                    <Text style={pkgStyles.catLabel}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                        {packageCategories.map((cat) => {
                            const CatIcon = packageCategoryIconFor(cat.icon);
                            const selected = data.category === cat.name;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => onChange('category', cat.name)}
                                    style={[pkgStyles.chip, selected && pkgStyles.chipActive]}
                                    activeOpacity={0.8}
                                >
                                    <CatIcon size={14} color={selected ? COLORS.primary : COLORS.textMuted} style={{ marginRight: 6 }} />
                                    <Text style={[pkgStyles.chipText, selected && pkgStyles.chipTextActive]}>
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </>
            )}

            <InputField
                label={isHouseShifting ? 'What are you moving? *' : 'Description *'}
                value={data.description} onChangeText={v => onChange('description', v)}
                placeholder={isHouseShifting ? 'e.g. 2BHK furniture, appliances, boxes' : 'e.g. Laptop, clothes, documents'}
                icon={FileText} error={errors.description}
            />

            {isHouseShifting ? (
                <View style={pkgStyles.helpersCard}>
                    <View style={pkgStyles.helpersHeaderRow}>
                        <Text style={pkgStyles.helpersTitle}>Loading/Unloading Helpers</Text>
                        {helperRate != null && (
                            <Text style={pkgStyles.helpersRate}>₹{helperRate}/helper</Text>
                        )}
                    </View>
                    <View style={pkgStyles.stepperRow}>
                        <TouchableOpacity
                            style={pkgStyles.stepperBtn}
                            disabled={data.helpersCount <= 1}
                            onPress={() => onChange('helpersCount', Math.max(1, data.helpersCount - 1))}
                        >
                            <Text style={pkgStyles.stepperBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={pkgStyles.stepperValue}>{data.helpersCount}</Text>
                        <TouchableOpacity
                            style={pkgStyles.stepperBtn}
                            disabled={data.helpersCount >= 4}
                            onPress={() => onChange('helpersCount', Math.min(4, data.helpersCount + 1))}
                        >
                            <Text style={pkgStyles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                        {helperRate != null && (
                            <Text style={pkgStyles.helpersTotal}>= ₹{helperRate * data.helpersCount}</Text>
                        )}
                    </View>
                    {errors.helpersCount && <Text style={pkgStyles.helpersError}>{errors.helpersCount as any}</Text>}
                </View>
            ) : (
                <>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <InputField label="Weight (kg) *" value={data.weight} onChangeText={v => onChange('weight', v)}
                                placeholder="e.g. 2.5" icon={Weight} keyboardType="decimal-pad" error={errors.weight} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <InputField label="Quantity *" value={data.quantity} onChangeText={v => onChange('quantity', v)}
                                placeholder="1" keyboardType="numeric" error={errors.quantity} />
                        </View>
                    </View>

                    <SectionHeader title="Dimensions (optional)" subtitle="Length × Width × Height in cm" />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                            <InputField label="L (cm)" value={data.length} onChangeText={v => onChange('length', v)}
                                placeholder="30" keyboardType="numeric" icon={Ruler} error={errors.length} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <InputField label="W (cm)" value={data.width} onChangeText={v => onChange('width', v)}
                                placeholder="20" keyboardType="numeric" error={errors.width} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <InputField label="H (cm)" value={data.height} onChangeText={v => onChange('height', v)}
                                placeholder="15" keyboardType="numeric" error={errors.height} />
                        </View>
                    </View>
                </>
            )}

            {/* Toggles */}
            <View style={pkgStyles.toggleCard}>
                <View style={pkgStyles.toggleRow}>
                    <View style={pkgStyles.toggleLeft}>
                        <AlertTriangle color={COLORS.warning} width={18} height={18} />
                        <View style={{ marginLeft: 10 }}>
                            <Text style={pkgStyles.toggleTitle}>Fragile Item</Text>
                            <Text style={pkgStyles.toggleSub}>Handle with extra care</Text>
                        </View>
                    </View>
                    <Switch
                        value={data.fragile}
                        onValueChange={v => onChange('fragile', v)}
                        trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                        thumbColor={data.fragile ? COLORS.primary : '#f4f3f4'}
                    />
                </View>

                <View style={pkgStyles.divider} />

                <View style={pkgStyles.toggleRow}>
                    <View style={pkgStyles.toggleLeft}>
                        <CheckCircle color={COLORS.success} width={18} height={18} />
                        <View style={{ marginLeft: 10 }}>
                            <Text style={pkgStyles.toggleTitle}>Request Insurance</Text>
                            {/* Was "Protection up to ₹10,000" — no real insurance product
                                exists yet; this just flags the request for admin/driver. */}
                            <Text style={pkgStyles.toggleSub}>Flags this for admin review</Text>
                        </View>
                    </View>
                    <Switch
                        value={data.insurance}
                        onValueChange={v => onChange('insurance', v)}
                        trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                        thumbColor={data.insurance ? COLORS.primary : '#f4f3f4'}
                    />
                </View>
            </View>

            <NavButtons onBack={onBack} onNext={() => { if (validate()) onNext(); }} />
        </ScrollView>
    );
};

const makePkgStyles = (COLORS: OrderColors) => StyleSheet.create({
    catLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, letterSpacing: 0.3 },
    chip: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border,
        marginRight: 8, backgroundColor: COLORS.surface,
    },
    chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
    chipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
    chipTextActive: { color: COLORS.primary, fontWeight: '700' },
    toggleCard: {
        backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
        borderWidth: 1.5, borderColor: COLORS.border,
        padding: 16, marginBottom: 16,
    },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    toggleLeft: { flexDirection: 'row', alignItems: 'center' },
    toggleTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
    toggleSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
    helpersCard: {
        backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
        borderWidth: 1.5, borderColor: COLORS.border,
        padding: 16, marginBottom: 16,
    },
    helpersHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    helpersTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
    helpersRate: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
    stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    stepperBtn: {
        width: 40, height: 40, borderRadius: RADIUS.md,
        backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
    },
    stepperBtnText: { fontSize: 20, fontWeight: '700', color: COLORS.primary, lineHeight: 22 },
    stepperValue: { fontSize: 18, fontWeight: '700', color: COLORS.text, minWidth: 24, textAlign: 'center' },
    helpersTotal: { marginLeft: 'auto', fontSize: 14, fontWeight: '700', color: COLORS.text },
    helpersError: { color: COLORS.danger, fontSize: 11, marginTop: 8 },
});

// ─── STEP 4: ORDER DETAILS + REVIEW ──────────────────────────────────────────

const StepOrderDetails = ({
    data, onChange, onBack, allData, category, submitting, onSubmit, fareEstimate,
}: {
    data: OrderDetailsForm;
    onChange: <K extends keyof OrderDetailsForm>(key: K, val: OrderDetailsForm[K]) => void;
    onBack: () => void;
    allData: AllOrderData;
    category: ShipmentCategory;
    submitting: boolean;
    onSubmit: () => void;
    fareEstimate: FareEstimate;
}) => {
    const { colors: BRAND } = useAppTheme();
    const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
    const odStyles = useMemo(() => makeOdStyles(COLORS), [COLORS]);
    const { data: businessSettingsData } = useBusinessSettings();
    const expressSurcharge = Number(businessSettingsData?.find((s) => s.key === 'service_type_express_surcharge')?.value ?? 0);
    const sameDaySurcharge = Number(businessSettingsData?.find((s) => s.key === 'service_type_same_day_surcharge')?.value ?? 0);
    const SERVICE_TYPES = useMemo(
        () => makeServiceTypes(COLORS, expressSurcharge, sameDaySurcharge),
        [COLORS, expressSurcharge, sameDaySurcharge],
    );
    // Real, admin-managed vehicle types (GET /settings/vehicle-configs) —
    // previously a hardcoded bike/van/truck array here, so renaming, adding,
    // or deactivating a vehicle type in the admin panel never reached this
    // screen at all. House Shifting excludes bike — a bike can't move
    // furniture/helpers, so it's never offered for that category.
    const { data: vehicleConfigsData } = useVehicleConfigs();
    const activeVehicleConfigs = useMemo(
        () => (vehicleConfigsData ?? []).filter((v) => v.active && (category !== 'HOUSE_SHIFTING' || v.name.toLowerCase() !== 'bike')),
        [vehicleConfigsData, category],
    );
    // If the currently-selected type was deactivated/renamed/removed since
    // the form's default was set, fall back to the first active config
    // rather than silently submitting a vehicle type the backend will
    // reject as "unknown or inactive" at quote/booking time.
    useEffect(() => {
        if (activeVehicleConfigs.length === 0) return;
        const stillValid = activeVehicleConfigs.some((v) => v.name.toLowerCase() === data.vehicleType.toLowerCase());
        if (!stillValid) {
            onChange('vehicleType', activeVehicleConfigs[0].name.toLowerCase());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeVehicleConfigs]);
    // Was adding a flat ₹49/₹29 here for fragile/insurance — a fee that
    // was never actually charged (no payment gateway exists), just
    // silently baked into the displayed total. fragile/insuranceRequested
    // are now real, persisted flags (kalanabhaBackend 5f7763e) shown as
    // plain requests below, with no invented price attached to either.
    // Real, distance-based fare from the pickup/drop coordinates + the
    // selected vehicle's rate card. Was falling back to a flat guess
    // ({standard: 99, ...}) on a geocode/quote failure and displaying it as
    // a normal total — indistinguishable from a real price, right above a
    // Place Order button that would then hard-block on the same failure.
    // `total` is null whenever there's no real price to show yet.
    const basePrice = fareEstimate.price;
    const total = basePrice;

    return (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Service Type */}
            <SectionHeader title="Service Type" subtitle="Choose your delivery speed" />
            <View style={odStyles.serviceRow}>
                {SERVICE_TYPES.map(svc => (
                    <TouchableOpacity
                        key={svc.key}
                        onPress={() => onChange('serviceType', svc.key)}
                        style={[
                            odStyles.serviceCard,
                            data.serviceType === svc.key && odStyles.serviceCardActive,
                        ]}
                        activeOpacity={0.8}
                    >
                        {data.serviceType === svc.key && (
                            <View style={odStyles.selectedBadge}><Check size={12} color="#fff" strokeWidth={3} /></View>
                        )}
                        <Text style={odStyles.svcDays}>{svc.days}</Text>
                        <Text style={[odStyles.svcLabel, { color: svc.color }]}>{svc.label}</Text>
                        <Text style={odStyles.svcDesc}>{svc.desc}</Text>
                        <Text style={[odStyles.svcPrice, data.serviceType === svc.key && { color: COLORS.primary }]}>
                            {svc.priceLabel}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Vehicle Type */}
            <SectionHeader title="Vehicle Type" subtitle="Select based on package weight" />
            <View style={odStyles.vehicleRow}>
                {activeVehicleConfigs.map((vt) => {
                    const isSelected = data.vehicleType.toLowerCase() === vt.name.toLowerCase();
                    return (
                        <TouchableOpacity
                            key={vt.id}
                            onPress={() => onChange('vehicleType', vt.name.toLowerCase())}
                            style={[odStyles.vehicleCard, isSelected && odStyles.vehicleCardActive]}
                            activeOpacity={0.8}
                        >
                            {/* Real, admin-set illustration (KalanabhaAdmin Vehicle
                                Configs) — falls back to the same icon mapping until
                                an admin sets one. */}
                            <VehicleVisual
                                vehicle={vt}
                                size={56}
                                iconSize={30}
                                borderRadius={12}
                                backgroundColor="transparent"
                                iconColor={isSelected ? COLORS.primary : COLORS.textSecondary}
                            />
                            <Text style={[odStyles.vehicleLabel, isSelected && { color: COLORS.primary }]}>
                                {vt.name}
                            </Text>
                            <Text style={odStyles.vehicleDesc}>Up to {vt.maxWeight} kg</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Payment Mode */}
            <SectionHeader title="Payment Method" />
            {PAYMENT_MODES.map(pm => (
                <TouchableOpacity
                    key={pm.key}
                    onPress={() => onChange('paymentMode', pm.key)}
                    style={[odStyles.payRow, data.paymentMode === pm.key && odStyles.payRowActive]}
                    activeOpacity={0.8}
                >
                    <pm.icon
                        color={data.paymentMode === pm.key ? COLORS.primary : COLORS.textSecondary}
                        size={18}
                        style={odStyles.payIcon}
                    />
                    <Text style={[odStyles.payLabel, data.paymentMode === pm.key && { color: COLORS.primary, fontWeight: '700' }]}>
                        {pm.label}
                    </Text>
                    <View style={[odStyles.radio, data.paymentMode === pm.key && odStyles.radioActive]}>
                        {data.paymentMode === pm.key && <View style={odStyles.radioDot} />}
                    </View>
                </TouchableOpacity>
            ))}

            {/* Pickup Slot */}
            <SectionHeader title="Pickup Time Slot" subtitle="When should we collect?" />
            <View style={odStyles.slotGrid}>
                {PICKUP_SLOTS.map(slot => (
                    <TouchableOpacity
                        key={slot}
                        onPress={() => onChange('pickupSlot', slot)}
                        style={[
                            odStyles.slotChip,
                            data.pickupSlot === slot && odStyles.slotChipActive,
                        ]}
                        activeOpacity={0.8}
                    >
                        <Text style={[odStyles.slotText, data.pickupSlot === slot && odStyles.slotTextActive]}>
                            {slot}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Notes */}
            <SectionHeader title="Delivery Notes" subtitle="Optional instructions for courier" />
            <View style={odStyles.notesBox}>
                <TextInput
                    style={odStyles.notesInput}
                    value={data.notes}
                    onChangeText={v => onChange('notes', v)}
                    placeholder="e.g. Call before delivery, leave at gate..."
                    placeholderTextColor={COLORS.placeholder}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                />
            </View>

            {/* ── Hero fare card ── */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={odStyles.fareHero}
            >
                <View style={odStyles.fareHeroRow}>
                    {(() => {
                        const VehicleIcon = vehicleIconFor(data.vehicleType);
                        return <VehicleIcon color="#fff" size={34} style={odStyles.fareHeroIcon} />;
                    })()}
                    <View style={{ flex: 1 }}>
                        <Text style={odStyles.fareHeroLabel}>
                            {fareEstimate.loading
                                ? 'Calculating your fare…'
                                : fareEstimate.error
                                    ? 'Unable to estimate'
                                    : 'Estimated Fare'}
                        </Text>
                        {fareEstimate.loading ? (
                            <ActivityIndicator color="#fff" style={{ alignSelf: 'flex-start', marginTop: 6 }} />
                        ) : fareEstimate.error ? (
                            // Was showing "₹0" (or ₹49/₹29 from fees alone) here on a
                            // geocode/quote failure — a real number in a fare-looking
                            // slot, when there's no real fare at all yet.
                            <Text style={odStyles.fareHeroPrice}>—</Text>
                        ) : (
                            <Text style={odStyles.fareHeroPrice}>₹{fareEstimate.price ?? 0}</Text>
                        )}
                    </View>
                    {fareEstimate.distanceKm != null && (
                        <View style={odStyles.fareHeroChip}>
                            <Text style={odStyles.fareHeroChipText}>{fareEstimate.distanceKm} km</Text>
                        </View>
                    )}
                </View>
            </LinearGradient>

            {/* ── Order Summary Review ── */}
            <View style={odStyles.reviewSection}>
                <SectionHeader title="Order Summary" subtitle="Review before confirming" />

                <View style={odStyles.summaryCard}>
                    {/* Route */}
                    <View style={odStyles.routeBox}>
                        <View style={odStyles.routePoint}>
                            <View style={[odStyles.routeDot, { backgroundColor: COLORS.primary }]} />
                            <View style={{ marginLeft: 10 }}>
                                <Text style={odStyles.routeRole}>PICKUP</Text>
                                <Text style={odStyles.routeName}>{allData.sender.name}</Text>
                                {/* address already ends in "<locality>, <city>" (composeAddress) */}
                                <Text style={odStyles.routeAddr}>{allData.sender.address}</Text>
                            </View>
                        </View>
                        <View style={odStyles.routeDashedLine} />
                        <View style={odStyles.routePoint}>
                            <View style={[odStyles.routeDot, { backgroundColor: COLORS.success }]} />
                            <View style={{ marginLeft: 10 }}>
                                <Text style={odStyles.routeRole}>DELIVERY</Text>
                                <Text style={odStyles.routeName}>{allData.receiver.name}</Text>
                                <Text style={odStyles.routeAddr}>{allData.receiver.address}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={odStyles.summDivider} />

                    {/* Package Summary */}
                    <View style={odStyles.summRow}>
                        <Text style={odStyles.summKey}>Package</Text>
                        <Text style={odStyles.summVal}>{allData.package.category} · {allData.package.weight} kg</Text>
                    </View>
                    <View style={odStyles.summRow}>
                        <Text style={odStyles.summKey}>Quantity</Text>
                        <Text style={odStyles.summVal}>{allData.package.quantity} item(s)</Text>
                    </View>
                    {allData.package.fragile && (
                        <View style={odStyles.summRow}>
                            <Text style={odStyles.summKey}>Fragile</Text>
                            <View style={odStyles.summValRow}>
                                <AlertTriangle size={13} color={COLORS.warning} />
                                <Text style={[odStyles.summVal, { color: COLORS.warning }]}>Handle with care</Text>
                            </View>
                        </View>
                    )}
                    {allData.package.insurance && (
                        <View style={odStyles.summRow}>
                            <Text style={odStyles.summKey}>Insurance</Text>
                            <View style={odStyles.summValRow}>
                                <Check size={13} color={COLORS.success} strokeWidth={3} />
                                {/* Was "Covered up to ₹10,000" — no real insurance product
                                    exists behind this yet, just a request flag driver/admin
                                    can see. Don't promise coverage that isn't real. */}
                                <Text style={[odStyles.summVal, { color: COLORS.success }]}>Requested</Text>
                            </View>
                        </View>
                    )}
                    <View style={odStyles.summRow}>
                        <Text style={odStyles.summKey}>Vehicle</Text>
                        <Text style={odStyles.summVal}>
                            {activeVehicleConfigs.find((v) => v.name.toLowerCase() === data.vehicleType.toLowerCase())?.name
                                ?? data.vehicleType}
                        </Text>
                    </View>
                    <View style={odStyles.summRow}>
                        <Text style={odStyles.summKey}>Pickup Slot</Text>
                        <Text style={odStyles.summVal}>{data.pickupSlot}</Text>
                    </View>
                    <View style={odStyles.summRow}>
                        <Text style={odStyles.summKey}>Payment</Text>
                        <Text style={odStyles.summVal}>{PAYMENT_MODES.find(p => p.key === data.paymentMode)?.label}</Text>
                    </View>

                    <View style={odStyles.summDivider} />

                    {/* Price breakdown — base fare shown in the hero card above */}
                    {fareEstimate.error && (
                        <View style={odStyles.fareErrorRow}>
                            <AlertTriangle size={12} color={COLORS.warning} />
                            {/* Was "— showing a flat estimate instead", implying the order
                                could still go through — it couldn't. Real coordinates for
                                pickup/drop are required for dispatch/tracking, so there's
                                no flat-estimate fallback that actually lets this order be
                                placed; the button below is disabled until this resolves. */}
                            <Text style={odStyles.fareError}>{fareEstimate.error} — fix the address to continue</Text>
                        </View>
                    )}
                    {/* helperCost is already folded into fareEstimate.price by
                        PricingService — shown here as a breakdown line, not
                        added again into `total`. */}
                    {category === 'HOUSE_SHIFTING' && !!fareEstimate.helperCost && (
                        <View style={odStyles.summRow}>
                            <Text style={odStyles.summKey}>Helpers ({allData.package.helpersCount})</Text>
                            <Text style={odStyles.summVal}>₹{fareEstimate.helperCost}</Text>
                        </View>
                    )}
                    <View style={odStyles.totalRow}>
                        <Text style={odStyles.totalLabel}>Total Amount</Text>
                        <Text style={odStyles.totalValue}>{total != null ? `₹${total}` : '—'}</Text>
                    </View>
                </View>
            </View>

            <NavButtons
                onBack={onBack}
                onNext={onSubmit}
                nextLabel={
                    fareEstimate.loading
                        ? 'Calculating fare…'
                        : fareEstimate.error
                            ? 'Fix address to continue'
                            : 'Place Order'
                }
                loading={submitting || fareEstimate.loading}
                disabled={!!fareEstimate.error}
            />
        </ScrollView>
    );
};

const makeOdStyles = (COLORS: OrderColors) => StyleSheet.create({
    serviceRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
    serviceCard: {
        flex: 1, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border,
        backgroundColor: COLORS.surface, padding: 14, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    serviceCardActive: {
        borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight,
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    },
    selectedBadge: {
        position: 'absolute', top: -8, right: -8,
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: COLORS.surface,
    },
    selectedBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
    svcDays: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
    svcLabel: { fontSize: 14, fontWeight: '800', marginBottom: 3 },
    svcDesc: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
    svcPrice: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 8 },

    vehicleRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
    vehicleCard: {
        flex: 1, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border,
        backgroundColor: COLORS.surface, padding: 12, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    vehicleCardActive: {
        borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight,
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    },
    vehicleIcon: { marginBottom: 4 },
    vehicleLabel: { fontSize: 13, fontWeight: '800', color: COLORS.text, marginTop: 6 },
    vehicleDesc: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },

    payRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg,
        padding: 16, marginBottom: 10, backgroundColor: COLORS.surface,
    },
    payRowActive: {
        borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2,
    },
    payIcon: {},
    payLabel: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '600' },
    radio: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center',
    },
    radioActive: { borderColor: COLORS.primary },
    radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: COLORS.primary },

    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    slotChip: {
        paddingHorizontal: 14, paddingVertical: 9,
        borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    slotChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
    slotText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
    slotTextActive: { color: COLORS.primary, fontWeight: '700' },

    notesBox: {
        borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
        padding: 12, backgroundColor: COLORS.surface, marginBottom: 20,
        minHeight: 80,
    },
    notesInput: { fontSize: 14, color: COLORS.text, lineHeight: 22 },

    reviewSection: { marginTop: 8 },
    summaryCard: {
        backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
        borderWidth: 1.5, borderColor: COLORS.border, padding: 16, marginBottom: 8,
    },
    routeBox: { marginBottom: 12 },
    routePoint: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    routeDot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
    routeRole: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 },
    routeName: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 1 },
    routeAddr: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
    routeDashedLine: {
        width: 1, height: 16, borderStyle: 'dashed', borderWidth: 1,
        borderColor: COLORS.border, marginLeft: 5, marginBottom: 4,
    },
    summDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
    summRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summKey: { fontSize: 13, color: COLORS.textSecondary },
    summVal: { fontSize: 13, color: COLORS.text, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
    summValRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    totalRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md,
        padding: 12, marginTop: 4,
    },
    totalLabel: { fontSize: 14, fontWeight: '700', color: COLORS.primaryDark },
    totalValue: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
    fareErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -4, marginBottom: 8 },
    fareError: { fontSize: 11, color: COLORS.warning, flexShrink: 1 },

    // ── Hero fare card (Rapido-style "confirm ride" price display)
    fareHero: {
        borderRadius: RADIUS.xl,
        padding: 18,
        marginBottom: 4,
        shadowColor: COLORS.primaryDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 14,
        elevation: 6,
    },
    fareHeroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    fareHeroIcon: {},
    fareHeroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', letterSpacing: 0.3 },
    fareHeroPrice: { fontSize: 30, color: '#fff', fontWeight: '800', marginTop: 2 },
    fareHeroChip: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: RADIUS.full,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    fareHeroChipText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

// ─── SUCCESS MODAL ────────────────────────────────────────────────────────────

const SuccessModal = ({ visible, trackingId, onDone }: {
    visible: boolean;
    trackingId: string;
    onDone: () => void;
}) => {
    const { colors: BRAND } = useAppTheme();
    const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
    const successStyles = useMemo(() => makeSuccessStyles(COLORS), [COLORS]);
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={successStyles.overlay}>
                <Animated.View style={[successStyles.card, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
                    <View style={successStyles.iconRing}>
                        <CheckCircle color={COLORS.success} width={52} height={52} />
                    </View>
                    <Text style={successStyles.title}>Order Placed!</Text>
                    <Text style={successStyles.subtitle}>Your shipment has been booked successfully.</Text>

                    <View style={successStyles.trackingBox}>
                        <Text style={successStyles.trackingLabel}>Tracking ID</Text>
                        <Text style={successStyles.trackingId}>{trackingId}</Text>
                    </View>

                    <Text style={successStyles.hint}>Save this tracking ID to monitor your shipment in real-time.</Text>

                    <TouchableOpacity style={successStyles.doneBtn} onPress={onDone} activeOpacity={0.85}>
                        <Text style={successStyles.doneBtnText}>Go to Home</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const makeSuccessStyles = (COLORS: OrderColors) => StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center', justifyContent: 'center', padding: 24,
    },
    card: {
        backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
        padding: 28, width: '100%', alignItems: 'center',
    },
    iconRing: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: COLORS.successLight, alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
    subtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
    trackingBox: {
        backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md,
        padding: 14, width: '100%', alignItems: 'center', marginBottom: 12,
    },
    trackingLabel: { fontSize: 11, color: COLORS.primary, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
    trackingId: { fontSize: 20, fontWeight: '800', color: COLORS.primaryDark, letterSpacing: 2 },
    hint: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginBottom: 24 },
    doneBtn: {
        backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
        paddingVertical: 14, paddingHorizontal: 40, width: '100%', alignItems: 'center',
    },
    doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ─── STEP INDICATOR HEADER ────────────────────────────────────────────────────

const StepHeader = ({ current, total }: { current: number; total: number }) => {
    const { colors: BRAND } = useAppTheme();
    const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
    const headerStyles = useMemo(() => makeHeaderStyles(COLORS), [COLORS]);
    const progress = ((current) / (total - 1)) * 100;
    return (
        <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={headerStyles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <Text style={headerStyles.title}>New Order</Text>
            <Text style={headerStyles.subtitle}>
                Step {current + 1} of {total} — {STEPS[current].description}
            </Text>
            <View style={headerStyles.track}>
                <View style={[headerStyles.fill, { width: `${progress}%` }]} />
            </View>
            <View style={headerStyles.stepsRow}>
                {STEPS.map((step, idx) => {
                    const done = idx < current;
                    const active = idx === current;
                    return (
                        <React.Fragment key={step.label}>
                            <View style={headerStyles.stepNode}>
                                <View style={[
                                    headerStyles.stepCircle,
                                    done && headerStyles.stepDone,
                                    active && headerStyles.stepActive,
                                ]}>
                                    <Text style={[
                                        headerStyles.stepNum,
                                        done && headerStyles.stepNumDone,
                                        active && headerStyles.stepNumActive,
                                    ]}>
                                        {done ? <Check size={16} color="#fff" strokeWidth={3} /> : step.icon}
                                    </Text>
                                </View>
                                <Text style={[
                                    headerStyles.stepLabel,
                                    (done || active) && headerStyles.stepLabelActive,
                                ]}>
                                    {step.label}
                                </Text>
                            </View>
                            {idx < STEPS.length - 1 && (
                                <View style={[headerStyles.connector, done && headerStyles.connectorDone]} />
                            )}
                        </React.Fragment>
                    );
                })}
            </View>
        </LinearGradient>
    );
};

const makeHeaderStyles = (COLORS: OrderColors) => StyleSheet.create({
    gradient: {
        paddingTop: Platform.OS === 'ios' ? 55 : 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    title: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
    subtitle: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 3, marginBottom: 14 },
    track: {
        height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2,
        overflow: 'hidden', marginBottom: 18,
    },
    fill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
    stepsRow: { flexDirection: 'row', alignItems: 'flex-start' },
    stepNode: { alignItems: 'center', width: 52 },
    stepCircle: {
        width: 36, height: 36, borderRadius: 18,
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center', justifyContent: 'center',
    },
    stepDone: { backgroundColor: '#fff', borderColor: '#fff' },
    stepActive: {
        backgroundColor: '#fff', borderColor: '#fff',
        shadowColor: '#fff', shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
    },
    stepNum: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
    stepNumDone: { color: COLORS.primary, fontWeight: '800' },
    stepNumActive: { color: COLORS.primary, fontWeight: '800' },
    stepLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 4, fontWeight: '500' },
    stepLabelActive: { color: '#fff', fontWeight: '700' },
    connector: {
        flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.2)',
        marginTop: 17, borderRadius: 1,
    },
    connectorDone: { backgroundColor: '#fff' },
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const NewOrder = () => {
    const { colors: BRAND } = useAppTheme();
    const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
    const mainStyles = useMemo(() => makeMainStyles(COLORS), [COLORS]);
    const navigation = useNavigation();
    // Optional hand-off from CheckRate.tsx's "Book This Shipment" — only
    // pre-fills the pickup/drop addresses and vehicle type it already
    // collected, so the rate the user just saw and this booking are for the
    // same route/vehicle instead of starting over from blank fields.
    const route = useRoute<any>();
    const prefill = route.params?.prefill as
        | { pickup?: string; drop?: string; vehicleType?: string; category?: ShipmentCategory }
        | undefined;

    // Real logged-in customer's profile (GET /users/me, hydrated into the
    // auth store) — the sender is almost always the account holder
    // themselves, so pre-filling name/phone/email/address from their real
    // profile saves re-typing every single order instead of starting blank.
    // Still fully editable — someone booking on a business's behalf can
    // change any field.
    const user = useAuthStore((s) => s.user);

    const [step, setStep] = useState(0);
    // Porter-style booking type, chosen on StepCategory (step 0). Drives the
    // Package step's fields, the Vehicle Type choices (no bike for House
    // Shifting), and the real per-helper charge added server-side.
    const [category, setCategory] = useState<ShipmentCategory>(prefill?.category ?? 'PARCEL');
    const [sender, setSender] = useState<SenderForm>(() => ({
        ...INIT_SENDER,
        name: user?.displayName ?? INIT_SENDER.name,
        phone: user?.phone ?? INIT_SENDER.phone,
        email: user?.email ?? INIT_SENDER.email,
    }));
    const [receiver, setReceiver] = useState<ReceiverForm>(INIT_RECEIVER);

    // Admin-managed service areas (GET /settings/service-areas) — the
    // source of truth for real pickup/drop coordinates, replacing the
    // previous free-text address + always-geocode approach. sender/
    // receiver's address/city/pincode are kept in sync from whichever area
    // is selected (see updateSender/updateReceiver and selectPickupPlace/
    // selectDropPlace below) purely so the rest of the app/API payload
    // still sees plain strings, same as before.
    const { data: serviceAreasData } = useServiceAreas();
    const activeAreas = useMemo(() => (serviceAreasData ?? []).filter((a) => a.active), [serviceAreasData]);

    const [pickupPlace, setPickupPlace] = useState<ServiceArea | null>(null);
    const [dropPlace, setDropPlace] = useState<ServiceArea | null>(null);
    // Optional OpenStreetMap-refined coordinates within the selected area
    // (LocationRefiner) — overrides the area's center when present, but
    // never required: the area's own lat/lng is always a valid fallback.
    const [pickupRefine, setPickupRefine] = useState<(KnownCoords & { label: string }) | null>(null);
    const [dropRefine, setDropRefine] = useState<(KnownCoords & { label: string }) | null>(null);
    const [pkg, setPkg] = useState<PackageForm>(INIT_PACKAGE);
    const [orderDetails, setOrderDetails] = useState<OrderDetailsForm>(
        prefill?.vehicleType
            ? { ...INIT_ORDER, vehicleType: prefill.vehicleType as OrderDetailsForm['vehicleType'] }
            : INIT_ORDER,
    );
    const [submitting, setSubmitting] = useState(false);
    const [trackingId, setTrackingId] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Effective coordinates: an OpenStreetMap-refined point within the area
    // if the customer searched for one, else the area's own center — one
    // or the other is always available once a place is picked, so this
    // never comes back null/blocking the way free-text geocoding could.
    const pickupCoords: KnownCoords | null = pickupRefine ?? (pickupPlace ? { lat: pickupPlace.lat, lng: pickupPlace.lng } : null);
    const dropCoords: KnownCoords | null = dropRefine ?? (dropPlace ? { lat: dropPlace.lat, lng: dropPlace.lng } : null);

    // Real, distance-based fare — ready as soon as both places are picked,
    // independent of which step is currently showing so it's ready by the
    // time the user reaches Review instead of loading there.
    const fareEstimate = useFareEstimate(
        sender.address ? `${sender.address}, ${sender.city}` : '',
        receiver.address ? `${receiver.address}, ${receiver.city}` : '',
        orderDetails.vehicleType,
        orderDetails.serviceType,
        pickupCoords,
        dropCoords,
        category,
        category === 'HOUSE_SHIFTING' ? pkg.helpersCount : undefined,
    );

    // Real, admin-set per-helper rate (BusinessSetting
    // 'helper_rate_per_person') — shown on the Package step before booking
    // so the customer sees the same number PricingService will actually
    // charge, not a guess baked into the app.
    const { data: businessSettingsData } = useBusinessSettings();
    const helperRate = useMemo(() => {
        const raw = businessSettingsData?.find((s) => s.key === 'helper_rate_per_person')?.value;
        return raw != null ? Number(raw) : null;
    }, [businessSettingsData]);

    // CheckRate.tsx's prefill carries free-text addresses (its own pickup/
    // drop inputs aren't place-backed) — only auto-select once the real
    // service-area list has loaded, and only when the text unambiguously
    // names exactly one known locality; otherwise the customer picks from
    // the dropdown themselves rather than us guessing.
    useEffect(() => {
        if (activeAreas.length === 0) return;
        const matchFromText = (text?: string): ServiceArea | null => {
            if (!text) return null;
            const q = text.trim().toLowerCase();
            const matches = activeAreas.filter((a) => q.includes(a.name.toLowerCase()));
            return matches.length === 1 ? matches[0] : null;
        };
        if (!pickupPlace) {
            const matched = matchFromText(prefill?.pickup);
            if (matched) {
                setPickupPlace(matched);
                setSender(prev => ({ ...prev, address: composeAddress(prev.landmark, matched), city: matched.city, pincode: matched.pincode }));
            }
        }
        if (!dropPlace) {
            const matched = matchFromText(prefill?.drop);
            if (matched) {
                setDropPlace(matched);
                setReceiver(prev => ({ ...prev, address: composeAddress(prev.landmark, matched), city: matched.city, pincode: matched.pincode }));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeAreas.length]);

    // Register FCM token when customer opens this screen
    useEffect(() => {
        registerFCMToken('customer');
        const unsub = setupFCMListeners((title, body, data) => {
            Alert.alert(title, body);
        });
        return () => unsub();
    }, []);

    const animateToStep = useCallback((nextStep: number, direction: 'forward' | 'back') => {
        const outX = direction === 'forward' ? -30 : 30;
        const inX = direction === 'forward' ? 30 : -30;

        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 130, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: outX, duration: 130, useNativeDriver: true }),
        ]).start(() => {
            setStep(nextStep);
            slideAnim.setValue(inX);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
            ]).start();
        });
    }, [fadeAnim, slideAnim]);

    const goNext = useCallback(() => {
        if (step < STEPS.length - 1) animateToStep(step + 1, 'forward');
    }, [step, animateToStep]);

    const goBack = useCallback(() => {
        if (step > 0) animateToStep(step - 1, 'back');
    }, [step, animateToStep]);

    const updateSender = useCallback((key: keyof SenderForm, val: string) =>
        setSender(prev => {
            const next = { ...prev, [key]: val };
            if (key === 'landmark') next.address = composeAddress(val, pickupPlace);
            return next;
        }), [pickupPlace]);

    const updateReceiver = useCallback((key: keyof ReceiverForm, val: string) =>
        setReceiver(prev => {
            const next = { ...prev, [key]: val };
            if (key === 'landmark') next.address = composeAddress(val, dropPlace);
            return next;
        }), [dropPlace]);

    const selectPickupPlace = useCallback((p: ServiceArea) => {
        setPickupPlace(p);
        setPickupRefine(null); // a refined point belonged to the previous area
        setSender(prev => ({ ...prev, address: composeAddress(prev.landmark, p), city: p.city, pincode: p.pincode }));
    }, []);

    const selectDropPlace = useCallback((p: ServiceArea) => {
        setDropPlace(p);
        setDropRefine(null);
        setReceiver(prev => ({ ...prev, address: composeAddress(prev.landmark, p), city: p.city, pincode: p.pincode }));
    }, []);

    const updatePkg = useCallback(<K extends keyof PackageForm>(key: K, val: PackageForm[K]) =>
        setPkg(prev => ({ ...prev, [key]: val })), []);

    const updateOrderDetails = useCallback(<K extends keyof OrderDetailsForm>(key: K, val: OrderDetailsForm[K]) =>
        setOrderDetails(prev => ({ ...prev, [key]: val })), []);

    const allData: AllOrderData = useMemo(() => ({
        sender, receiver, package: pkg, orderDetails,
    }), [sender, receiver, pkg, orderDetails]);

    // POST /shipments — kalanabhaBackend ShipmentsService.create already
    // does the duplicate guard (same customer/from/to/pickupSlot while
    // searching/accepted) AND the Rapido-style auto-match server-side, so
    // neither needs doing client-side any more.
    const handleSubmit = useCallback(async (): Promise<void> => {
        const scope = 'CREATE_SHIPMENT';
        // One key per tap of the submit button — a network-level retry of
        // this same request (e.g. the axios 401-refresh-and-retry path)
        // reuses this same request config/header, so it still de-dupes;
        // a fresh tap after this one gets a new key/new logical attempt.
        const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        try {
            log(scope, 'START');
            setSubmitting(true);

            if (!fareEstimate.pickup || !fareEstimate.drop || fareEstimate.price == null) {
                Alert.alert('Fare not ready', 'Please wait for the fare estimate to finish calculating.');
                return;
            }

            const isHouseShifting = category === 'HOUSE_SHIFTING';

            const shipment = await createShipment({
                // House Shifting never collects a package category chip
                // (chips are hidden for it) — pkg.category would still hold
                // INIT_PACKAGE's 'Documents' default, which is wrong here.
                goodsType: isHouseShifting ? 'House Shifting' : (pkg?.category ?? 'General'),
                weightKg: isHouseShifting ? 0 : safeNumber(pkg?.weight),
                pickup: {
                    address: sender.address,
                    lat: fareEstimate.pickup.lat,
                    lng: fareEstimate.pickup.lng,
                },
                drop: {
                    address: receiver.address,
                    lat: fareEstimate.drop.lat,
                    lng: fareEstimate.drop.lng,
                },
                sender,
                receiver,
                package: isHouseShifting
                    ? { category: 'House Shifting' }
                    : { category: pkg?.category, weight: safeNumber(pkg?.weight) },
                serviceType: orderDetails.serviceType,
                vehicleType: orderDetails.vehicleType,
                paymentMode: orderDetails.paymentMode,
                pickupSlot: orderDetails.pickupSlot,
                // House Shifting has no separate "package category/weight"
                // fields to carry pkg.description (what's being moved) —
                // fold it into notes so the driver actually sees it. Parcel
                // flow is untouched (its description already implies the
                // package.category chip, unlike this one).
                notes: isHouseShifting && pkg?.description
                    ? `Items: ${pkg.description}${orderDetails.notes ? ` — ${orderDetails.notes}` : ''}`
                    : orderDetails.notes,
                category,
                helpersCount: isHouseShifting ? pkg.helpersCount : undefined,
                fragile: pkg.fragile,
                insuranceRequested: pkg.insurance,
            }, idempotencyKey);

            setTrackingId(shipment.trackingId);
            setShowSuccess(true);

            log(scope, 'SUCCESS', { id: shipment.id });
        } catch (err: unknown) {
            logError(scope, err);
            Alert.alert('Error', normalizeError(err));
        } finally {
            setSubmitting(false);
            log(scope, 'END');
        }
    }, [sender, receiver, pkg, orderDetails, fareEstimate, category]);

    const handleDone = useCallback(() => {
        setShowSuccess(false);
        navigation.goBack();
    }, [navigation]);

    return (
        <View style={mainStyles.root}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            {/* Back button on header */}
            <StepHeader current={step} total={STEPS.length} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.select({ ios: 'padding' })}
                keyboardVerticalOffset={0}
            >
                <Animated.View
                    style={[
                        mainStyles.content,
                        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
                    ]}
                >
                    {step === 0 && (
                        <StepCategory
                            value={category}
                            onSelect={setCategory}
                            onNext={goNext}
                        />
                    )}
                    {step === 1 && (
                        <StepSender
                            data={sender}
                            onChange={updateSender}
                            areas={activeAreas}
                            place={pickupPlace}
                            onSelectPlace={selectPickupPlace}
                            otherPlace={dropPlace}
                            refined={pickupRefine}
                            onRefine={setPickupRefine}
                            onNext={goNext}
                            onBack={goBack}
                        />
                    )}
                    {step === 2 && (
                        <StepReceiver
                            data={receiver}
                            onChange={updateReceiver}
                            areas={activeAreas}
                            place={dropPlace}
                            onSelectPlace={selectDropPlace}
                            otherPlace={pickupPlace}
                            refined={dropRefine}
                            onRefine={setDropRefine}
                            onNext={goNext}
                            onBack={goBack}
                        />
                    )}
                    {step === 3 && (
                        <StepPackage
                            data={pkg}
                            onChange={updatePkg}
                            category={category}
                            helperRate={helperRate}
                            onNext={goNext}
                            onBack={goBack}
                        />
                    )}
                    {step === 4 && (
                        <StepOrderDetails
                            data={orderDetails}
                            onChange={updateOrderDetails}
                            onBack={goBack}
                            allData={allData}
                            category={category}
                            submitting={submitting}
                            onSubmit={handleSubmit}
                            fareEstimate={fareEstimate}
                        />
                    )}
                </Animated.View>
            </KeyboardAvoidingView>

            <SuccessModal
                visible={showSuccess}
                trackingId={trackingId}
                onDone={handleDone}
            />
        </View>
    );
};

export default NewOrder;

const makeMainStyles = (COLORS: OrderColors) => StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bg },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
});