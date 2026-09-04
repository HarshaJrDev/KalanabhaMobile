
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
    type LucideIcon,
} from 'lucide-react-native';
import { registerFCMToken, setupFCMListeners } from '@utils/cm';
import { useVehicleConfigs } from '@features/settings/hooks';
import { useAuthStore } from '@features/store/authStore';
import { useFareEstimate, FareEstimate } from '@location/useFareEstimate';
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
    address: string;
    city: string;
    pincode: string;
};

type ReceiverForm = {
    name: string;
    phone: string;
    email: string;
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
    price: number
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

const PACKAGE_CATEGORIES = ['Documents', 'Electronics', 'Clothing', 'Food', 'Furniture', 'Medicine', 'Other'];

const makeServiceTypes = (COLORS: OrderColors): { key: OrderDetailsForm['serviceType']; label: string; desc: string; price: string; days: string; color: string }[] => [
    { key: 'standard', label: 'Standard', desc: 'Reliable delivery', price: '₹99', days: '3-5 days', color: COLORS.textSecondary },
    { key: 'express', label: 'Express', desc: 'Faster delivery', price: '₹199', days: '1-2 days', color: COLORS.primary },
    { key: 'same-day', label: 'Same Day', desc: 'Deliver today', price: '₹349', days: 'Today', color: COLORS.success },
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

const INIT_SENDER: SenderForm = { name: '', phone: '', email: '', address: '', city: '', pincode: '' };
const INIT_RECEIVER: ReceiverForm = { name: '', phone: '', email: '', address: '', city: '', pincode: '' };
const INIT_PACKAGE: PackageForm = {
    description: '', weight: '', length: '', width: '', height: '',
    quantity: '1', fragile: false, insurance: false, category: 'Documents',
    price: 0
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
    loading = false, isFirst = false,
}: {
    onBack?: () => void;
    onNext: () => void;
    nextLabel?: string;
    loading?: boolean;
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
                style={[navStyles.nextBtn, isFirst && { flex: 1 }]}
                onPress={onNext}
                activeOpacity={0.85}
                disabled={loading}
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
    nextText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ─── STEP 1: SENDER ───────────────────────────────────────────────────────────

const StepSender = ({
    data, onChange, onNext,
}: {
    data: SenderForm;
    onChange: (key: keyof SenderForm, val: string) => void;
    onNext: () => void;
}) => {
    const [errors, setErrors] = useState<Partial<SenderForm>>({});

    const validate = () => {
        const e: Partial<SenderForm> = {};
        if (!data.name.trim()) e.name = 'Name is required';
        if (!data.phone.trim() || data.phone.length < 10) e.phone = 'Valid phone required';
        if (!data.address.trim()) e.address = 'Address is required';
        if (!data.city.trim()) e.city = 'City is required';
        if (!data.pincode.trim() || data.pincode.length < 6) e.pincode = 'Valid pincode required';
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
                placeholder="+91 98765 43210" icon={Phone} keyboardType="phone-pad" error={errors.phone} />
            <InputField label="Email Address" value={data.email} onChangeText={v => onChange('email', v)}
                placeholder="arjun@example.com" icon={Mail} keyboardType="email-address" />

            <SectionHeader title="Pickup Address" subtitle="Where should we pick it up?" />

            <InputField label="Street Address *" value={data.address} onChangeText={v => onChange('address', v)}
                placeholder="123, MG Road" icon={MapPin} error={errors.address} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                    <InputField label="City *" value={data.city} onChangeText={v => onChange('city', v)}
                        placeholder="Bangalore" error={errors.city} />
                </View>
                <View style={{ flex: 1 }}>
                    <InputField label="Pincode *" value={data.pincode} onChangeText={v => onChange('pincode', v)}
                        placeholder="560001" keyboardType="numeric" error={errors.pincode} />
                </View>
            </View>

            <NavButtons onNext={handleNext} isFirst />
        </ScrollView>
    );
};

// ─── STEP 2: RECEIVER ─────────────────────────────────────────────────────────

const StepReceiver = ({
    data, onChange, onNext, onBack,
}: {
    data: ReceiverForm;
    onChange: (key: keyof ReceiverForm, val: string) => void;
    onNext: () => void;
    onBack: () => void;
}) => {
    const [errors, setErrors] = useState<Partial<ReceiverForm>>({});

    const validate = () => {
        const e: Partial<ReceiverForm> = {};
        if (!data.name.trim()) e.name = 'Name is required';
        if (!data.phone.trim() || data.phone.length < 10) e.phone = 'Valid phone required';
        if (!data.address.trim()) e.address = 'Address is required';
        if (!data.city.trim()) e.city = 'City is required';
        if (!data.pincode.trim() || data.pincode.length < 6) e.pincode = 'Valid pincode required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    return (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <SectionHeader title="Receiver Information" subtitle="Who receives this package?" />

            <InputField label="Full Name *" value={data.name} onChangeText={v => onChange('name', v)}
                placeholder="e.g. Priya Patel" icon={User} error={errors.name} />
            <InputField label="Phone Number *" value={data.phone} onChangeText={v => onChange('phone', v)}
                placeholder="+91 87654 32100" icon={Phone} keyboardType="phone-pad" error={errors.phone} />
            <InputField label="Email Address" value={data.email} onChangeText={v => onChange('email', v)}
                placeholder="priya@example.com" icon={Mail} keyboardType="email-address" />

            <SectionHeader title="Delivery Address" subtitle="Where should we deliver?" />

            <InputField label="Street Address *" value={data.address} onChangeText={v => onChange('address', v)}
                placeholder="456 Brigade Road" icon={MapPin} error={errors.address} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                    <InputField label="City *" value={data.city} onChangeText={v => onChange('city', v)}
                        placeholder="Hyderabad" error={errors.city} />
                </View>
                <View style={{ flex: 1 }}>
                    <InputField label="Pincode *" value={data.pincode} onChangeText={v => onChange('pincode', v)}
                        placeholder="500001" keyboardType="numeric" error={errors.pincode} />
                </View>
            </View>

            <NavButtons onBack={onBack} onNext={() => { if (validate()) onNext(); }} />
        </ScrollView>
    );
};

// ─── STEP 3: PACKAGE ──────────────────────────────────────────────────────────

const StepPackage = ({
    data, onChange, onNext, onBack,
}: {
    data: PackageForm;
    onChange: <K extends keyof PackageForm>(key: K, val: PackageForm[K]) => void;
    onNext: () => void;
    onBack: () => void;
}) => {
    const { colors: BRAND } = useAppTheme();
    const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
    const pkgStyles = useMemo(() => makePkgStyles(COLORS), [COLORS]);
    const [errors, setErrors] = useState<Partial<Record<keyof PackageForm, string>>>({});

    const validate = () => {
        const e: typeof errors = {};
        if (!data.description.trim()) e.description = 'Description is required';
        if (!data.weight || isNaN(Number(data.weight))) e.weight = 'Valid weight required';
        if (!data.quantity || Number(data.quantity) < 1) e.quantity = 'Quantity must be ≥ 1';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    return (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <SectionHeader title="Package Details" subtitle="Tell us about your shipment" />

            {/* Category chips */}
            <Text style={pkgStyles.catLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {PACKAGE_CATEGORIES.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => onChange('category', cat)}
                        style={[pkgStyles.chip, data.category === cat && pkgStyles.chipActive]}
                        activeOpacity={0.8}
                    >
                        <Text style={[pkgStyles.chipText, data.category === cat && pkgStyles.chipTextActive]}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <InputField label="Description *" value={data.description} onChangeText={v => onChange('description', v)}
                placeholder="e.g. Laptop, clothes, documents" icon={FileText} error={errors.description} />

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
                        placeholder="30" keyboardType="numeric" icon={Ruler} />
                </View>
                <View style={{ flex: 1 }}>
                    <InputField label="W (cm)" value={data.width} onChangeText={v => onChange('width', v)}
                        placeholder="20" keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                    <InputField label="H (cm)" value={data.height} onChangeText={v => onChange('height', v)}
                        placeholder="15" keyboardType="numeric" />
                </View>
            </View>

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
                            <Text style={pkgStyles.toggleTitle}>Add Insurance</Text>
                            <Text style={pkgStyles.toggleSub}>Protection up to ₹10,000</Text>
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
});

// ─── STEP 4: ORDER DETAILS + REVIEW ──────────────────────────────────────────

const StepOrderDetails = ({
    data, onChange, onBack, allData, submitting, onSubmit, fareEstimate,
}: {
    data: OrderDetailsForm;
    onChange: <K extends keyof OrderDetailsForm>(key: K, val: OrderDetailsForm[K]) => void;
    onBack: () => void;
    allData: AllOrderData;
    submitting: boolean;
    onSubmit: () => void;
    fareEstimate: FareEstimate;
}) => {
    const { colors: BRAND } = useAppTheme();
    const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
    const odStyles = useMemo(() => makeOdStyles(COLORS), [COLORS]);
    const SERVICE_TYPES = useMemo(() => makeServiceTypes(COLORS), [COLORS]);
    // Real, admin-managed vehicle types (GET /settings/vehicle-configs) —
    // previously a hardcoded bike/van/truck array here, so renaming, adding,
    // or deactivating a vehicle type in the admin panel never reached this
    // screen at all.
    const { data: vehicleConfigsData } = useVehicleConfigs();
    const activeVehicleConfigs = useMemo(
        () => (vehicleConfigsData ?? []).filter((v) => v.active),
        [vehicleConfigsData],
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
    const insuranceFee = allData.package.insurance ? 49 : 0;
    const fragileHandling = allData.package.fragile ? 29 : 0;
    // Real, distance-based fare from the pickup/drop coordinates + the
    // selected vehicle's rate card — falls back to a flat estimate only
    // while the geocode/quote is still loading or failed.
    const basePrice = fareEstimate.price ?? { standard: 99, express: 199, 'same-day': 349 }[data.serviceType];
    const total = basePrice + insuranceFee + fragileHandling;

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
                            {svc.price}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Vehicle Type */}
            <SectionHeader title="Vehicle Type" subtitle="Select based on package weight" />
            <View style={odStyles.vehicleRow}>
                {activeVehicleConfigs.map((vt) => {
                    const VtIcon = vehicleIconFor(vt.name);
                    const isSelected = data.vehicleType.toLowerCase() === vt.name.toLowerCase();
                    return (
                        <TouchableOpacity
                            key={vt.id}
                            onPress={() => onChange('vehicleType', vt.name.toLowerCase())}
                            style={[odStyles.vehicleCard, isSelected && odStyles.vehicleCardActive]}
                            activeOpacity={0.8}
                        >
                            <VtIcon
                                color={isSelected ? COLORS.primary : COLORS.textSecondary}
                                size={22}
                                style={odStyles.vehicleIcon}
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
                            {fareEstimate.loading ? 'Calculating your fare…' : 'Estimated Fare'}
                        </Text>
                        {fareEstimate.loading ? (
                            <ActivityIndicator color="#fff" style={{ alignSelf: 'flex-start', marginTop: 6 }} />
                        ) : (
                            <Text style={odStyles.fareHeroPrice}>
                                ₹{(fareEstimate.price ?? 0) + (allData.package.insurance ? 49 : 0) + (allData.package.fragile ? 29 : 0)}
                            </Text>
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
                                <Text style={odStyles.routeAddr}>{allData.sender.address}, {allData.sender.city}</Text>
                            </View>
                        </View>
                        <View style={odStyles.routeDashedLine} />
                        <View style={odStyles.routePoint}>
                            <View style={[odStyles.routeDot, { backgroundColor: COLORS.success }]} />
                            <View style={{ marginLeft: 10 }}>
                                <Text style={odStyles.routeRole}>DELIVERY</Text>
                                <Text style={odStyles.routeName}>{allData.receiver.name}</Text>
                                <Text style={odStyles.routeAddr}>{allData.receiver.address}, {allData.receiver.city}</Text>
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
                                <Text style={[odStyles.summVal, { color: COLORS.success }]}>Covered up to ₹10,000</Text>
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
                            <Text style={odStyles.fareError}>{fareEstimate.error} — showing a flat estimate instead</Text>
                        </View>
                    )}
                    {insuranceFee > 0 && (
                        <View style={odStyles.summRow}>
                            <Text style={odStyles.summKey}>Insurance</Text>
                            <Text style={odStyles.summVal}>₹{insuranceFee}</Text>
                        </View>
                    )}
                    {fragileHandling > 0 && (
                        <View style={odStyles.summRow}>
                            <Text style={odStyles.summKey}>Fragile handling</Text>
                            <Text style={odStyles.summVal}>₹{fragileHandling}</Text>
                        </View>
                    )}

                    <View style={odStyles.totalRow}>
                        <Text style={odStyles.totalLabel}>Total Amount</Text>
                        <Text style={odStyles.totalValue}>₹{total}</Text>
                    </View>
                </View>
            </View>

            <NavButtons
                onBack={onBack}
                onNext={onSubmit}
                nextLabel={fareEstimate.loading ? 'Calculating fare…' : 'Place Order'}
                loading={submitting || fareEstimate.loading}
            />
        </ScrollView>
    );
};

const makeOdStyles = (COLORS: OrderColors) => StyleSheet.create({
    serviceRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    serviceCard: {
        flex: 1, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border,
        backgroundColor: COLORS.surface, padding: 12, alignItems: 'center',
    },
    serviceCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
    selectedBadge: {
        position: 'absolute', top: 6, right: 6,
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    },
    selectedBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
    svcDays: { fontSize: 11, color: COLORS.textMuted, marginBottom: 2 },
    svcLabel: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
    svcDesc: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
    svcPrice: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 6 },

    vehicleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    vehicleCard: {
        flex: 1, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border,
        backgroundColor: COLORS.surface, padding: 12, alignItems: 'center',
    },
    vehicleCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
    vehicleIcon: { marginBottom: 4 },
    vehicleLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text },
    vehicleDesc: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },

    payRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
        padding: 14, marginBottom: 10, backgroundColor: COLORS.surface,
    },
    payRowActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
    payIcon: {},
    payLabel: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },
    radio: {
        width: 20, height: 20, borderRadius: 10,
        borderWidth: 2, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center',
    },
    radioActive: { borderColor: COLORS.primary },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },

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
        | { pickup?: string; drop?: string; vehicleType?: string }
        | undefined;

    // Real logged-in customer's profile (GET /users/me, hydrated into the
    // auth store) — the sender is almost always the account holder
    // themselves, so pre-filling name/phone/email/address from their real
    // profile saves re-typing every single order instead of starting blank.
    // Still fully editable — someone booking on a business's behalf can
    // change any field.
    const user = useAuthStore((s) => s.user);

    const [step, setStep] = useState(0);
    const [sender, setSender] = useState<SenderForm>(() => ({
        ...INIT_SENDER,
        name: user?.displayName ?? INIT_SENDER.name,
        phone: user?.phone ?? INIT_SENDER.phone,
        email: user?.email ?? INIT_SENDER.email,
        address: prefill?.pickup ?? user?.address ?? INIT_SENDER.address,
    }));
    const [receiver, setReceiver] = useState<ReceiverForm>(
        prefill?.drop ? { ...INIT_RECEIVER, address: prefill.drop } : INIT_RECEIVER,
    );
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

    // Real, distance-based fare — geocodes once sender/receiver addresses
    // are filled in, independent of which step is currently showing so it's
    // ready by the time the user reaches Review instead of loading there.
    const fareEstimate = useFareEstimate(
        sender.address ? `${sender.address}, ${sender.city}` : '',
        receiver.address ? `${receiver.address}, ${receiver.city}` : '',
        orderDetails.vehicleType,
        orderDetails.serviceType,
    );

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
        setSender(prev => ({ ...prev, [key]: val })), []);

    const updateReceiver = useCallback((key: keyof ReceiverForm, val: string) =>
        setReceiver(prev => ({ ...prev, [key]: val })), []);

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

            const shipment = await createShipment({
                goodsType: pkg?.category ?? 'General',
                weightKg: safeNumber(pkg?.weight),
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
                package: { category: pkg?.category, weight: safeNumber(pkg?.weight) },
                serviceType: orderDetails.serviceType,
                vehicleType: orderDetails.vehicleType,
                paymentMode: orderDetails.paymentMode,
                pickupSlot: orderDetails.pickupSlot,
                notes: orderDetails.notes,
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
    }, [sender, receiver, pkg, orderDetails, fareEstimate]);

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
                        <StepSender
                            data={sender}
                            onChange={updateSender}
                            onNext={goNext}
                        />
                    )}
                    {step === 1 && (
                        <StepReceiver
                            data={receiver}
                            onChange={updateReceiver}
                            onNext={goNext}
                            onBack={goBack}
                        />
                    )}
                    {step === 2 && (
                        <StepPackage
                            data={pkg}
                            onChange={updatePkg}
                            onNext={goNext}
                            onBack={goBack}
                        />
                    )}
                    {step === 3 && (
                        <StepOrderDetails
                            data={orderDetails}
                            onChange={updateOrderDetails}
                            onBack={goBack}
                            allData={allData}
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