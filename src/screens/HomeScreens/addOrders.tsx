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
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { showToast } from '@ui/alert/toastStore';
import { Illustration } from '@components/Illustration';
import { Images } from '@assets/images';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  User,
  Phone,
  MapPin,
  Mail,
  Weight,
  Ruler,
  AlertTriangle,
  FileText,
  Truck,
  CheckCircle,
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
  Tag,
  Calendar,
  Users,
  PackageOpen,
  type LucideIcon,
} from 'lucide-react-native';
import { registerFCMToken } from '@utils/cm';
import {
  useVehicleConfigs,
  useServiceAreas,
  useBusinessSettings,
  usePackageCategories,
} from '@features/settings/hooks';
import { useVehicleSearch } from '@features/vehicles/useVehicleSearch';
import { useAuthStore } from '@features/store/authStore';
import { useUpdateProfile } from '@hooks/useUpdateProfile';
import type { ServiceArea } from '@features/settings/types';
import VehicleSelectCards from '@components/VehicleSelectCards';
import PlacePicker from '@components/PlacePicker';
import { DateTimeChipPicker } from '@components/DateTimeChipPicker';
import {
  useFareEstimate,
  FareEstimate,
  type KnownCoords,
} from '@location/useFareEstimate';
import { forwardGeocode } from '@services/location';
import { useCreateShipment, useMyShipmentHistory } from '@features/shipments/hooks';
import { useSavedAddresses } from '@features/savedAddresses/hooks';
import type { SavedAddress } from '@features/savedAddresses/types';
import {
  useValidatePromoCode,
  useActivePromoCodes,
} from '@features/promotions/hooks';
import { usePayForShipment } from '@features/payments/hooks';
import { safeNumber } from '@utils/parsers';
import { normalizeError } from '@utils/error';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import FONTS from '@utils/fonts';
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

type SenderForm = {
  name: string;
  phone: string;
  email: string;
  
  
  
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
  loadingHelp: boolean;
  unloadingHelp: boolean;
  packaging: boolean;
  category: string;
  price: number;


  helpersCount: number;
};

type OrderDetailsForm = {
  serviceType: 'standard' | 'express' | 'same-day';
  
  
  
  vehicleType: string;
  paymentMode: 'prepaid' | 'cod' | 'credit';
  notes: string;
  pickupDate: string;
  pickupSlot: string;
  
  
  promoCode: string;
  
  
  scheduled: boolean;
  
  scheduledAt: string;
  
  
  deliveryInstructions: string[];
};

type AllOrderData = {
  sender: SenderForm;
  receiver: ReceiverForm;
  package: PackageForm;
  orderDetails: OrderDetailsForm;
};

const log = (scope: string, message: string, data?: unknown) => {
  
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

const makeSteps = (t: (key: string) => string) => [
  {
    label: t('addOrder.stepLabelCategory'),
    icon: <Truck size={24} color="#FF7518" />,
    description: t('addOrder.stepDescCategory'),
  },
  {
    label: t('addOrder.stepLabelSender'),
    icon: <User size={24} color="#FF7518" />,
    description: t('addOrder.stepDescSender'),
  },
  {
    label: t('addOrder.stepLabelReceiver'),
    icon: <Send size={24} color="#FF7518" />,
    description: t('addOrder.stepDescReceiver'),
  },
  {
    label: t('addOrder.stepLabelPackage'),
    icon: <Package size={24} color="#FF7518" />,
    description: t('addOrder.stepDescPackage'),
  },
  {
    label: t('addOrder.stepLabelReview'),
    icon: <CircleCheck size={24} color="#FF7518" />,
    description: t('addOrder.stepDescReview'),
  },
];







const PACKAGE_CATEGORY_ICONS: Record<string, LucideIcon> = {
  FileText,
  Smartphone,
  Shirt,
  UtensilsCrossed,
  Sofa,
  Pill,
  Package,
};
const packageCategoryIconFor = (icon: string): LucideIcon =>
  PACKAGE_CATEGORY_ICONS[icon] ?? Package;









const makeServiceTypes = (
  COLORS: OrderColors,
  expressSurcharge: number,
  sameDaySurcharge: number,
  t: (key: string) => string,
): {
  key: OrderDetailsForm['serviceType'];
  label: string;
  desc: string;
  priceLabel: string;
  days: string;
  color: string;
}[] => [
  {
    key: 'standard',
    label: t('addOrder.serviceStandard'),
    desc: t('addOrder.serviceStandardDesc'),
    priceLabel: t('addOrder.serviceIncluded'),
    days: t('addOrder.serviceStandardDays'),
    color: COLORS.textSecondary,
  },
  {
    key: 'express',
    label: t('addOrder.serviceExpress'),
    desc: t('addOrder.serviceExpressDesc'),
    priceLabel: `+₹${expressSurcharge}`,
    days: t('addOrder.serviceExpressDays'),
    color: COLORS.primary,
  },
  {
    key: 'same-day',
    label: t('addOrder.serviceSameDay'),
    desc: t('addOrder.serviceSameDayDesc'),
    priceLabel: `+₹${sameDaySurcharge}`,
    days: t('addOrder.serviceSameDayDays'),
    color: COLORS.success,
  },
];




const VEHICLE_ICON_BY_NAME: Record<string, LucideIcon> = {
  bike: Bike,
  van: Car,
  truck: Truck,
};
const vehicleIconFor = (name: string): LucideIcon =>
  VEHICLE_ICON_BY_NAME[name.toLowerCase()] ?? Truck;

const makePaymentModes = (
  t: (key: string) => string,
): {
  key: OrderDetailsForm['paymentMode'];
  label: string;
  icon: LucideIcon;
}[] => [
  { key: 'prepaid', label: t('addOrder.paymentOnlineUpi'), icon: CreditCard },
  { key: 'cod', label: t('addOrder.paymentCod'), icon: Banknote },
  { key: 'credit', label: t('addOrder.paymentCredit'), icon: Landmark },
];

const makePickupSlots = (t: (key: string) => string) => [
  t('addOrder.slot9to11'),
  t('addOrder.slot11to1'),
  t('addOrder.slot2to4'),
  t('addOrder.slot4to6'),
];




const PICKUP_SLOTS = [
  '9:00 AM – 11:00 AM',
  '11:00 AM – 1:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
];






const isSlotPassed = (slot: string): boolean => {
  const endLabel = slot.split('–')[1]?.trim();
  if (!endLabel) return false;
  const match = endLabel.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return false;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const isPM = match[3].toUpperCase() === 'PM';
  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  const slotEnd = new Date();
  slotEnd.setHours(hours, minutes, 0, 0);
  return Date.now() > slotEnd.getTime();
};




const DELIVERY_INSTRUCTION_OPTIONS = [
  'leaveAtDoor',
  'callBeforeDelivery',
  'handToSecurity',
  'callOnArrival',
] as const;



const INIT_SENDER: SenderForm = {
  name: '',
  phone: '',
  email: '',
  landmark: '',
  address: '',
  city: '',
  pincode: '',
};
const INIT_RECEIVER: ReceiverForm = {
  name: '',
  phone: '',
  email: '',
  landmark: '',
  address: '',
  city: '',
  pincode: '',
};
const INIT_PACKAGE: PackageForm = {
  description: '',
  weight: '',
  length: '',
  width: '',
  height: '',
  quantity: '1',
  fragile: false,
  insurance: false,
  loadingHelp: false,
  unloadingHelp: false,
  packaging: false,
  category: 'Documents',
  price: 0,
  helpersCount: 1,
};
const INIT_ORDER: OrderDetailsForm = {
  serviceType: 'standard',
  vehicleType: 'bike',
  paymentMode: 'prepaid',
  notes: '',
  pickupDate: '',
  pickupSlot: PICKUP_SLOTS[0],
  promoCode: '',
  scheduled: false,
  scheduledAt: '',
  deliveryInstructions: [],
};

// Dev-only "random test order" fill — see fillRandomTestOrder below.
// Plain fake names/phones for local testing, never sent anywhere except
// this device's own backend in a __DEV__ build.
const DEV_TEST_FIRST_NAMES = ['Arjun', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Anita', 'Karthik', 'Divya'];
const DEV_TEST_LAST_NAMES = ['Reddy', 'Sharma', 'Verma', 'Iyer', 'Rao', 'Nair', 'Gupta', 'Patel'];
const randomDevName = () =>
  `${DEV_TEST_FIRST_NAMES[Math.floor(Math.random() * DEV_TEST_FIRST_NAMES.length)]} ${
    DEV_TEST_LAST_NAMES[Math.floor(Math.random() * DEV_TEST_LAST_NAMES.length)]
  }`;
const randomDevPhone = () => `9${Math.floor(100000000 + Math.random() * 900000000)}`;

// ─── REUSABLE SUB-COMPONENTS ──────────────────────────────────────────────────

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon: Icon,
  keyboardType = 'default',
  error,
  secureTextEntry = false,
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
  
  
  
  
  const isRequired = label.endsWith('*');
  const labelText = isRequired ? label.slice(0, -1).trimEnd() : label;
  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>
        {labelText}
        {isRequired && <Text style={inputStyles.requiredMark}> *</Text>}
      </Text>
      <View
        style={[
          inputStyles.row,
          focused && inputStyles.rowFocused,
          !!error && inputStyles.rowError,
        ]}
      >
        {Icon && (
          <Icon
            color={focused ? COLORS.primary : COLORS.textMuted}
            width={16}
            height={16}
            style={inputStyles.icon}
          />
        )}
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
          
          
          
          
          
          importantForAutofill="no"
          autoComplete="off"
          autoCorrect={false}
          spellCheck={false}
        />
      </View>
      {error ? <Text style={inputStyles.error}>{error}</Text> : null}
    </View>
  );
};

const makeInputStyles = (COLORS: OrderColors) =>
  StyleSheet.create({
    wrapper: { marginBottom: 14 },
    label: {
      fontSize: 12,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
      color: COLORS.textSecondary,
      marginBottom: 5,
      letterSpacing: 0.3,
    },
    requiredMark: {
      color: COLORS.danger,
      fontFamily: FONTS.BOLD_PRIMARY,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: RADIUS.md,
      paddingHorizontal: 12,
      height: 48,
      backgroundColor: COLORS.surface,
    },
    rowFocused: { borderColor: COLORS.primary, backgroundColor: '#FAFCFF' },
    rowError: { borderColor: COLORS.danger },
    icon: { marginRight: 8 },
    
    
    
    
    
    input: {
      flex: 1,
      fontSize: 14,
      color: COLORS.text,
      height: '100%',
      backgroundColor: COLORS.surface,
    },
    error: { color: COLORS.danger, fontSize: 11, marginTop: 3 },
  });








const LocationRefiner = ({
  area,
  refined,
  onResolve,
}: {
  area: ServiceArea;
  refined: (KnownCoords & { label: string }) | null;
  onResolve: (result: (KnownCoords & { label: string }) | null) => void;
}) => {
  const { colors: BRAND } = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
  const refineStyles = useMemo(() => makeRefineStyles(COLORS), [COLORS]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'searching' | 'not-found'>(
    'idle',
  );

  const handleSearch = async () => {
    if (!query.trim()) return;
    setStatus('searching');
    const result = await forwardGeocode(
      `${query.trim()}, ${area.name}, ${area.city}`,
    );
    if (result) {
      onResolve({ ...result, label: query.trim() });
      setStatus('idle');
    } else {
      onResolve(null);
      setStatus('not-found');
    }
  };

  const handlePinOnMap = () => {
    navigation.navigate('LocationPinPicker', {
      initial: refined
        ? { lat: refined.lat, lng: refined.lng }
        : { lat: area.lat, lng: area.lng },
      initialAddress: refined?.label,
      onConfirm: (point: { lat: number; lng: number; address: string }) => {
        onResolve({ lat: point.lat, lng: point.lng, label: point.address });
      },
    });
  };

  return (
    <View style={refineStyles.wrapper}>
      <Text style={refineStyles.label}>
        {t('addOrder.pinpointLocationLabel')}
      </Text>
      <Text style={refineStyles.hint}>
        {t('addOrder.pinpointHint', { area: area.name })}
      </Text>
      <View style={refineStyles.row}>
        <Navigation
          size={15}
          color={COLORS.textMuted}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={refineStyles.input}
          value={query}
          onChangeText={v => {
            setQuery(v);
            if (status !== 'idle') setStatus('idle');
          }}
          placeholder={t('addOrder.pinpointPlaceholder', { area: area.name })}
          placeholderTextColor={COLORS.placeholder}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          onPress={handleSearch}
          disabled={status === 'searching'}
          style={refineStyles.searchBtn}
        >
          {status === 'searching' ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Search size={16} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={handlePinOnMap}
        style={refineStyles.pinOnMapRow}
      >
        <MapPin size={14} color={COLORS.primary} />
        <Text style={refineStyles.pinOnMapText}>{t('addOrder.pinOnMap')}</Text>
      </TouchableOpacity>
      {refined && (
        <View style={refineStyles.resultRow}>
          <Check size={13} color={COLORS.success} />
          <Text style={refineStyles.resultText} numberOfLines={1}>
            {t('addOrder.pinpointedResult', { label: refined.label })}
          </Text>
          <TouchableOpacity
            onPress={() => {
              onResolve(null);
              setQuery('');
            }}
          >
            <Text style={refineStyles.resetText}>{t('addOrder.reset')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {status === 'not-found' && (
        <Text style={refineStyles.notFoundText}>
          {t('addOrder.pinpointNotFound', { area: area.name })}
        </Text>
      )}
    </View>
  );
};

const makeRefineStyles = (COLORS: OrderColors) =>
  StyleSheet.create({
    wrapper: { marginBottom: 14 },
    label: {
      fontSize: 12,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
      color: COLORS.textSecondary,
      marginBottom: 2,
    },
    hint: { fontSize: 11, color: COLORS.textMuted, marginBottom: 6 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: RADIUS.md,
      paddingHorizontal: 12,
      height: 46,
      backgroundColor: COLORS.surface,
    },
    input: { flex: 1, fontSize: 14, color: COLORS.text, height: '100%' },
    searchBtn: { padding: 6 },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
    resultText: {
      flex: 1,
      fontSize: 12,
      color: COLORS.success,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
    },
    resetText: {
      fontSize: 12,
      color: COLORS.primary,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
    },
    notFoundText: {
      fontSize: 11,
      color: COLORS.warning,
      marginTop: 6,
      lineHeight: 15,
    },
    pinOnMapRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    pinOnMapText: {
      fontSize: 12,
      color: COLORS.primary,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
    },
  });

const SectionHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => {
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

const makeShStyles = (COLORS: OrderColors) =>
  StyleSheet.create({
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      marginTop: 4,
    },
    bar: {
      width: 4,
      height: 22,
      backgroundColor: COLORS.primary,
      borderRadius: 2,
      marginRight: 10,
    },
    title: { fontSize: 15, fontFamily: FONTS.BOLD_PRIMARY, color: COLORS.text },
    subtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  });

const NavButtons = ({
  onBack,
  onNext,
  nextLabel,
  loading = false,
  disabled = false,
  isFirst = false,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  isFirst?: boolean;
}) => {
  const { colors: BRAND } = useAppTheme();
  const { t } = useTranslation();
  const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
  const navStyles = useMemo(() => makeNavStyles(COLORS), [COLORS]);
  return (
    <View style={navStyles.row}>
      {!isFirst && (
        <TouchableOpacity
          style={navStyles.backBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <ArrowLeft color={COLORS.primary} width={16} height={16} />
          <Text style={navStyles.backText}>{t('addOrder.back')}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[
          navStyles.nextBtn,
          isFirst && { flex: 1 },
          disabled && navStyles.nextBtnDisabled,
        ]}
        onPress={onNext}
        activeOpacity={0.85}
        disabled={loading || disabled}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={navStyles.nextText}>
              {nextLabel ?? t('addOrder.continue')}
            </Text>
            <ArrowRight color="#fff" width={16} height={16} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const makeNavStyles = (COLORS: OrderColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1.5,
      borderColor: COLORS.primary,
      borderRadius: RADIUS.md,
      paddingHorizontal: 20,
      height: 50,
    },
    backText: {
      color: COLORS.primary,
      fontSize: 14,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
    },
    nextBtn: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: COLORS.primary,
      borderRadius: RADIUS.md,
      height: 50,
    },
    nextBtnDisabled: { backgroundColor: COLORS.textMuted, opacity: 0.7 },
    nextText: { color: '#fff', fontSize: 15, fontFamily: FONTS.BOLD_PRIMARY },
  });



const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



const composeAddress = (
  landmark: string,
  place: ServiceArea | null,
): string => {
  if (!place) return landmark.trim();
  return landmark.trim()
    ? `${landmark.trim()}, ${place.name}, ${place.city}`
    : `${place.name}, ${place.city}`;
};



type ShipmentCategory = 'PARCEL' | 'HOUSE_SHIFTING';




const CATEGORY_IMAGES: Record<ShipmentCategory, ReturnType<typeof require>> = {
  PARCEL: require('../../../assets/images/home/category-package.png'),
  HOUSE_SHIFTING: require('../../../assets/images/home/category-house-shifting.png'),
};

const makeCategoryOptions = (
  t: (key: string) => string,
): {
  key: ShipmentCategory;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}[] => [
  {
    key: 'PARCEL',
    title: t('addOrder.categoryParcelTitle'),
    subtitle: t('addOrder.categoryParcelSubtitle'),
    icon: Package,
  },
  {
    key: 'HOUSE_SHIFTING',
    title: t('addOrder.categoryHouseShiftingTitle'),
    subtitle: t('addOrder.categoryHouseShiftingSubtitle'),
    icon: Truck,
  },
];

const StepCategory = ({
  value,
  onSelect,
  onNext,
  recentOrders,
  onRepeatOrder,
}: {
  value: ShipmentCategory;
  onSelect: (category: ShipmentCategory) => void;
  onNext: () => void;
  recentOrders: import('@shipment/types').Shipment[];
  onRepeatOrder: (order: import('@shipment/types').Shipment) => void;
}) => {
  const { colors: BRAND } = useAppTheme();
  const { t } = useTranslation();
  const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
  const catStyles = useMemo(() => makeCategoryStyles(COLORS), [COLORS]);
  const CATEGORY_OPTIONS = useMemo(() => makeCategoryOptions(t), [t]);

  return (
    <ScrollView showsVerticalScrollIndicator={true}>
      {recentOrders.length > 0 && (
        <View style={{ marginBottom: 18 }}>
          <Text style={recentReceiverStyles.label}>
            {t('addOrder.repeatOrderLabel')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentOrders.map(order => (
              <TouchableOpacity
                key={order.id}
                style={catStyles.repeatOrderCard}
                activeOpacity={0.85}
                onPress={() => onRepeatOrder(order)}
              >
                <Text style={catStyles.repeatOrderRoute} numberOfLines={1}>
                  {order.from} → {order.to}
                </Text>
                <Text style={catStyles.repeatOrderMeta}>₹{order.price} · {order.goodsType}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <SectionHeader
        title={t('addOrder.categorySectionTitle')}
        subtitle={t('addOrder.categorySectionSubtitle')}
      />
      {CATEGORY_OPTIONS.map(opt => {
        const selected = value === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[catStyles.card, selected && catStyles.cardActive]}
            onPress={() => onSelect(opt.key)}
            activeOpacity={0.9}
          >
            <Image
              source={CATEGORY_IMAGES[opt.key]}
              resizeMode="cover"
              style={catStyles.image}
            />
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
            {t('addOrder.houseShiftingInfoText')}
          </Text>
        </View>
      )}
      <NavButtons onNext={onNext} isFirst />
    </ScrollView>
  );
};

const makeCategoryStyles = (COLORS: OrderColors) =>
  StyleSheet.create({
    repeatOrderCard: {
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: RADIUS.md,
      padding: 12,
      marginRight: 10,
      minWidth: 160,
      maxWidth: 200,
    },
    repeatOrderRoute: {
      fontSize: 12,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
      color: COLORS.text,
      marginBottom: 4,
    },
    repeatOrderMeta: {
      fontSize: 11,
      color: COLORS.textMuted,
    },
    card: {
      height: 152,
      borderRadius: RADIUS.lg,
      overflow: 'hidden',
      marginBottom: 14,
      position: 'relative',
      borderWidth: 2,
      borderColor: 'transparent',
      backgroundColor: COLORS.surface,
    },
    cardActive: { borderColor: COLORS.primary },
    image: {
      ...StyleSheet.absoluteFillObject,
      width: undefined,
      height: undefined,
    },
    scrim: { ...StyleSheet.absoluteFillObject },
    iconWrap: {
      position: 'absolute',
      top: 12,
      left: 12,
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: { position: 'absolute', left: 14, right: 14, bottom: 12 },
    title: { fontSize: 16, fontFamily: FONTS.BOLD_PRIMARY, color: '#fff' },
    subtitle: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.85)',
      marginTop: 3,
      lineHeight: 16,
    },
    checkBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: COLORS.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoBox: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-start',
      backgroundColor: COLORS.warningLight,
      borderRadius: RADIUS.md,
      padding: 12,
      marginBottom: 8,
    },
    infoText: { flex: 1, fontSize: 12, color: COLORS.text, lineHeight: 17 },
  });

const StepSender = ({
  data,
  onChange,
  areas,
  place,
  onSelectPlace,
  otherPlace,
  refined,
  onRefine,
  onNext,
  onBack,
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
  const { t } = useTranslation();
  const [errors, setErrors] = useState<
    Partial<Record<keyof SenderForm | 'place', string>>
  >({});

  
  
  
  
  
  const { data: savedAddresses } = useSavedAddresses();
  const applySavedAddress = (addr: SavedAddress) => {
    const matchedArea = areas.find(a => a.id === addr.serviceAreaId);
    if (matchedArea) onSelectPlace(matchedArea);
    const landmarkParts = [addr.houseNo, addr.floor, addr.landmark].filter(Boolean);
    if (landmarkParts.length > 0) onChange('landmark', landmarkParts.join(', '));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!data.name.trim()) e.name = t('addOrder.errorNameRequired');
    else if (data.name.trim().length < 2)
      e.name = t('addOrder.errorNameTooShort');
    if (!data.phone.trim()) e.phone = t('addOrder.errorPhoneRequired');
    else if (!/^\d{10}$/.test(data.phone.replace(/\D/g, '').slice(-10)))
      e.phone = t('addOrder.errorPhoneInvalid');
    if (data.email.trim() && !EMAIL_RE.test(data.email.trim()))
      e.email = t('addOrder.errorEmailInvalid');
    if (!place) e.place = t('addOrder.errorSelectPickupLocality');
    else if (otherPlace && place.id === otherPlace.id)
      e.place = t('addOrder.errorSamePickupDrop');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
    >
      <SectionHeader
        title={t('addOrder.senderSectionTitle')}
        subtitle={t('addOrder.senderSectionSubtitle')}
      />

      {!!savedAddresses?.length && (
        <View style={{ marginBottom: 16 }}>
          <Text style={recentReceiverStyles.label}>
            {t('addOrder.savedAddressesLabel')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {savedAddresses.map(addr => (
              <TouchableOpacity
                key={addr.id}
                style={recentReceiverStyles.chip}
                activeOpacity={0.8}
                onPress={() => applySavedAddress(addr)}
              >
                <MapPin size={12} color="#FF7518" />
                <Text style={recentReceiverStyles.chipText} numberOfLines={1}>
                  {addr.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <InputField
        label={t('addOrder.labelFullNameRequired')}
        value={data.name}
        onChangeText={v => onChange('name', v)}
        placeholder={t('addOrder.placeholderSenderName')}
        icon={User}
        error={errors.name}
      />
      <InputField
        label={t('addOrder.labelPhoneRequired')}
        value={data.phone}
        onChangeText={v => onChange('phone', v)}
        placeholder={t('addOrder.placeholderSenderPhone')}
        icon={Phone}
        keyboardType="phone-pad"
        error={errors.phone}
      />
      <InputField
        label={t('addOrder.labelEmail')}
        value={data.email}
        onChangeText={v => onChange('email', v)}
        placeholder={t('addOrder.placeholderSenderEmail')}
        icon={Mail}
        keyboardType="email-address"
        error={errors.email}
      />

      <SectionHeader
        title={t('addOrder.pickupAddressSectionTitle')}
        subtitle={t('addOrder.pickupAddressSectionSubtitle')}
      />

      <PlacePicker
        label={t('addOrder.labelLocalityRequired')}
        value={place}
        areas={areas}
        onSelect={onSelectPlace}
        placeholder={t('addOrder.placeholderPickupLocality')}
        error={errors.place}
      />
      {place && (
        <LocationRefiner area={place} refined={refined} onResolve={onRefine} />
      )}
      <InputField
        label={t('addOrder.labelHouseFlatLandmark')}
        value={data.landmark}
        onChangeText={v => onChange('landmark', v)}
        placeholder={t('addOrder.placeholderPickupLandmark')}
        icon={MapPin}
      />

      <NavButtons onBack={onBack} onNext={handleNext} />
    </ScrollView>
  );
};



const StepReceiver = ({
  data,
  onChange,
  areas,
  place,
  onSelectPlace,
  otherPlace,
  refined,
  onRefine,
  onNext,
  onBack,
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
  const { t } = useTranslation();
  const [errors, setErrors] = useState<
    Partial<Record<keyof ReceiverForm | 'place', string>>
  >({});
  
  
  
  
  const { data: shipmentHistory } = useMyShipmentHistory();
  const recentReceivers = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string; phone: string }[] = [];
    for (const s of shipmentHistory ?? []) {
      const phone = s.receiver?.phone?.trim();
      if (!phone || seen.has(phone)) continue;
      seen.add(phone);
      list.push({ name: s.receiver.name ?? '', phone });
      if (list.length >= 5) break;
    }
    return list;
  }, [shipmentHistory]);

  const validate = () => {
    const e: typeof errors = {};
    if (!data.name.trim()) e.name = t('addOrder.errorNameRequired');
    else if (data.name.trim().length < 2)
      e.name = t('addOrder.errorNameTooShort');
    if (!data.phone.trim()) e.phone = t('addOrder.errorPhoneRequired');
    else if (!/^\d{10}$/.test(data.phone.replace(/\D/g, '').slice(-10)))
      e.phone = t('addOrder.errorPhoneInvalid');
    if (data.email.trim() && !EMAIL_RE.test(data.email.trim()))
      e.email = t('addOrder.errorEmailInvalid');
    if (!place) e.place = t('addOrder.errorSelectDeliveryLocality');
    else if (otherPlace && place.id === otherPlace.id)
      e.place = t('addOrder.errorSamePickupDrop');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
    >
      <SectionHeader
        title={t('addOrder.receiverSectionTitle')}
        subtitle={t('addOrder.receiverSectionSubtitle')}
      />

      {recentReceivers.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={recentReceiverStyles.label}>
            {t('addOrder.recentReceiversLabel')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentReceivers.map(r => (
              <TouchableOpacity
                key={r.phone}
                style={recentReceiverStyles.chip}
                activeOpacity={0.8}
                onPress={() => {
                  onChange('name', r.name);
                  onChange('phone', r.phone);
                }}
              >
                <User size={12} color="#FF7518" />
                <Text style={recentReceiverStyles.chipText} numberOfLines={1}>
                  {r.name || r.phone}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <InputField
        label={t('addOrder.labelFullNameRequired')}
        value={data.name}
        onChangeText={v => onChange('name', v)}
        placeholder={t('addOrder.placeholderReceiverName')}
        icon={User}
        error={errors.name}
      />
      <InputField
        label={t('addOrder.labelPhoneRequired')}
        value={data.phone}
        onChangeText={v => onChange('phone', v)}
        placeholder={t('addOrder.placeholderReceiverPhone')}
        icon={Phone}
        keyboardType="phone-pad"
        error={errors.phone}
      />
      <InputField
        label={t('addOrder.labelEmail')}
        value={data.email}
        onChangeText={v => onChange('email', v)}
        placeholder={t('addOrder.placeholderReceiverEmail')}
        icon={Mail}
        keyboardType="email-address"
        error={errors.email}
      />

      <SectionHeader
        title={t('addOrder.deliveryAddressSectionTitle')}
        subtitle={t('addOrder.deliveryAddressSectionSubtitle')}
      />

      <PlacePicker
        label={t('addOrder.labelLocalityRequired')}
        value={place}
        areas={areas}
        onSelect={onSelectPlace}
        placeholder={t('addOrder.placeholderDeliveryLocality')}
        error={errors.place}
      />
      {place && (
        <LocationRefiner area={place} refined={refined} onResolve={onRefine} />
      )}
      <InputField
        label={t('addOrder.labelHouseFlatLandmark')}
        value={data.landmark}
        onChangeText={v => onChange('landmark', v)}
        placeholder={t('addOrder.placeholderDeliveryLandmark')}
        icon={MapPin}
      />

      <NavButtons
        onBack={onBack}
        onNext={() => {
          if (validate()) onNext();
        }}
      />
    </ScrollView>
  );
};



const StepPackage = ({
  data,
  onChange,
  category,
  helperRate,
  onNext,
  onBack,
}: {
  data: PackageForm;
  onChange: <K extends keyof PackageForm>(key: K, val: PackageForm[K]) => void;
  category: ShipmentCategory;
  helperRate: number | null;
  onNext: () => void;
  onBack: () => void;
}) => {
  const { colors: BRAND } = useAppTheme();
  const { t } = useTranslation();
  const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
  const pkgStyles = useMemo(() => makePkgStyles(COLORS), [COLORS]);
  const [errors, setErrors] = useState<
    Partial<Record<keyof PackageForm, string>>
  >({});
  const isHouseShifting = category === 'HOUSE_SHIFTING';
  const { data: packageCategoriesData } = usePackageCategories();
  const packageCategories = useMemo(
    () => (packageCategoriesData ?? []).filter(c => c.active),
    [packageCategoriesData],
  );

  const validate = () => {
    const e: typeof errors = {};
    if (!data.description.trim())
      e.description = t('addOrder.errorDescriptionRequired');
    else if (data.description.trim().length < 3)
      e.description = t('addOrder.errorDescriptionTooShort');

    if (isHouseShifting) {
      if (
        !Number.isInteger(data.helpersCount) ||
        data.helpersCount < 1 ||
        data.helpersCount > 4
      ) {
        e.helpersCount = t('addOrder.errorHelpersRange') as any;
      }
    } else {
      const weight = Number(data.weight);
      if (!data.weight.trim() || isNaN(weight) || weight <= 0)
        e.weight = t('addOrder.errorWeightRequired');
      else if (weight > 5000) e.weight = t('addOrder.errorWeightExceedsLimit');

      const quantity = Number(data.quantity);
      if (!data.quantity.trim() || !Number.isInteger(quantity) || quantity < 1)
        e.quantity = t('addOrder.errorQuantityInvalid');
      else if (quantity > 500) e.quantity = t('addOrder.errorQuantityExceedsLimit');

      
      
      (['length', 'width', 'height'] as const).forEach(dim => {
        if (!data[dim].trim()) return;
        const v = Number(data[dim]);
        if (isNaN(v) || v <= 0) e[dim] = t('addOrder.errorDimensionInvalid');
      });
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
    >
      <SectionHeader
        title={
          isHouseShifting
            ? t('addOrder.moveDetailsTitle')
            : t('addOrder.packageDetailsTitle')
        }
        subtitle={
          isHouseShifting
            ? t('addOrder.moveDetailsSubtitle')
            : t('addOrder.packageDetailsSubtitle')
        }
      />

      {!isHouseShifting && (
        <>
          {}
          <Text style={pkgStyles.catLabel}>
            {t('addOrder.categoryChipsLabel')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
          >
            {packageCategories.map(cat => {
              const CatIcon = packageCategoryIconFor(cat.icon);
              const selected = data.category === cat.name;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => onChange('category', cat.name)}
                  style={[pkgStyles.chip, selected && pkgStyles.chipActive]}
                  activeOpacity={0.8}
                >
                  <CatIcon
                    size={14}
                    color={selected ? COLORS.primary : COLORS.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      pkgStyles.chipText,
                      selected && pkgStyles.chipTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      <InputField
        label={
          isHouseShifting
            ? t('addOrder.labelWhatMoving')
            : t('addOrder.labelDescriptionRequired')
        }
        value={data.description}
        onChangeText={v => onChange('description', v)}
        placeholder={
          isHouseShifting
            ? t('addOrder.placeholderMovingDescription')
            : t('addOrder.placeholderPackageDescription')
        }
        icon={FileText}
        error={errors.description}
      />

      {isHouseShifting ? (
        <View style={pkgStyles.helpersCard}>
          <View style={pkgStyles.helpersHeaderRow}>
            <Text style={pkgStyles.helpersTitle}>
              {t('addOrder.helpersTitle')}
            </Text>
            {helperRate != null && (
              <Text style={pkgStyles.helpersRate}>₹{helperRate}/helper</Text>
            )}
          </View>
          <View style={pkgStyles.stepperRow}>
            <TouchableOpacity
              style={pkgStyles.stepperBtn}
              disabled={data.helpersCount <= 1}
              onPress={() =>
                onChange('helpersCount', Math.max(1, data.helpersCount - 1))
              }
            >
              <Text style={pkgStyles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={pkgStyles.stepperValue}>{data.helpersCount}</Text>
            <TouchableOpacity
              style={pkgStyles.stepperBtn}
              disabled={data.helpersCount >= 4}
              onPress={() =>
                onChange('helpersCount', Math.min(4, data.helpersCount + 1))
              }
            >
              <Text style={pkgStyles.stepperBtnText}>+</Text>
            </TouchableOpacity>
            {helperRate != null && (
              <Text style={pkgStyles.helpersTotal}>
                = ₹{helperRate * data.helpersCount}
              </Text>
            )}
          </View>
          {errors.helpersCount && (
            <Text style={pkgStyles.helpersError}>
              {errors.helpersCount as any}
            </Text>
          )}
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <InputField
                label={t('addOrder.labelWeightRequired')}
                value={data.weight}
                onChangeText={v => onChange('weight', v)}
                placeholder={t('addOrder.placeholderWeight')}
                icon={Weight}
                keyboardType="decimal-pad"
                error={errors.weight}
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label={t('addOrder.labelQuantityRequired')}
                value={data.quantity}
                onChangeText={v => onChange('quantity', v)}
                placeholder={t('addOrder.placeholderQuantity')}
                keyboardType="numeric"
                error={errors.quantity}
              />
            </View>
          </View>

          <SectionHeader
            title={t('addOrder.dimensionsSectionTitle')}
            subtitle={t('addOrder.dimensionsSectionSubtitle')}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <InputField
                label={t('addOrder.labelLength')}
                value={data.length}
                onChangeText={v => onChange('length', v)}
                placeholder={t('addOrder.placeholderLength')}
                keyboardType="numeric"
                icon={Ruler}
                error={errors.length}
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label={t('addOrder.labelWidth')}
                value={data.width}
                onChangeText={v => onChange('width', v)}
                placeholder={t('addOrder.placeholderWidth')}
                keyboardType="numeric"
                error={errors.width}
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label={t('addOrder.labelHeight')}
                value={data.height}
                onChangeText={v => onChange('height', v)}
                placeholder={t('addOrder.placeholderHeight')}
                keyboardType="numeric"
                error={errors.height}
              />
            </View>
          </View>
        </>
      )}

      {}
      <View style={pkgStyles.toggleCard}>
        <View style={pkgStyles.toggleRow}>
          <View style={pkgStyles.toggleLeft}>
            <AlertTriangle color={COLORS.warning} width={18} height={18} />
            <View style={{ marginLeft: 10 }}>
              <Text style={pkgStyles.toggleTitle}>
                {t('addOrder.fragileItemTitle')}
              </Text>
              <Text style={pkgStyles.toggleSub}>
                {t('addOrder.fragileItemSubtitle')}
              </Text>
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
              <Text style={pkgStyles.toggleTitle}>
                {t('addOrder.requestInsuranceTitle')}
              </Text>
              {}
              <Text style={pkgStyles.toggleSub}>
                {t('addOrder.requestInsuranceSubtitle')}
              </Text>
            </View>
          </View>
          <Switch
            value={data.insurance}
            onValueChange={v => onChange('insurance', v)}
            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
            thumbColor={data.insurance ? COLORS.primary : '#f4f3f4'}
          />
        </View>

        <View style={pkgStyles.divider} />

        <View style={pkgStyles.toggleRow}>
          <View style={pkgStyles.toggleLeft}>
            <Users color={COLORS.primary} width={18} height={18} />
            <View style={{ marginLeft: 10 }}>
              <Text style={pkgStyles.toggleTitle}>
                {t('addOrder.loadingHelpTitle')}
              </Text>
              <Text style={pkgStyles.toggleSub}>
                {t('addOrder.loadingHelpSubtitle')}
              </Text>
            </View>
          </View>
          <Switch
            value={data.loadingHelp}
            onValueChange={v => onChange('loadingHelp', v)}
            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
            thumbColor={data.loadingHelp ? COLORS.primary : '#f4f3f4'}
          />
        </View>

        <View style={pkgStyles.divider} />

        <View style={pkgStyles.toggleRow}>
          <View style={pkgStyles.toggleLeft}>
            <Users color={COLORS.primary} width={18} height={18} />
            <View style={{ marginLeft: 10 }}>
              <Text style={pkgStyles.toggleTitle}>
                {t('addOrder.unloadingHelpTitle')}
              </Text>
              <Text style={pkgStyles.toggleSub}>
                {t('addOrder.unloadingHelpSubtitle')}
              </Text>
            </View>
          </View>
          <Switch
            value={data.unloadingHelp}
            onValueChange={v => onChange('unloadingHelp', v)}
            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
            thumbColor={data.unloadingHelp ? COLORS.primary : '#f4f3f4'}
          />
        </View>

        <View style={pkgStyles.divider} />

        <View style={pkgStyles.toggleRow}>
          <View style={pkgStyles.toggleLeft}>
            <PackageOpen color={COLORS.primary} width={18} height={18} />
            <View style={{ marginLeft: 10 }}>
              <Text style={pkgStyles.toggleTitle}>
                {t('addOrder.packagingServiceTitle')}
              </Text>
              <Text style={pkgStyles.toggleSub}>
                {t('addOrder.packagingServiceSubtitle')}
              </Text>
            </View>
          </View>
          <Switch
            value={data.packaging}
            onValueChange={v => onChange('packaging', v)}
            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
            thumbColor={data.packaging ? COLORS.primary : '#f4f3f4'}
          />
        </View>
      </View>

      <NavButtons
        onBack={onBack}
        onNext={() => {
          if (validate()) onNext();
        }}
      />
    </ScrollView>
  );
};

const makePkgStyles = (COLORS: OrderColors) =>
  StyleSheet.create({
    catLabel: {
      fontSize: 12,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
      color: COLORS.textSecondary,
      marginBottom: 8,
      letterSpacing: 0.3,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: RADIUS.full,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      marginRight: 8,
      backgroundColor: COLORS.surface,
    },
    chipActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primaryLight,
    },
    chipText: {
      fontSize: 12,
      color: COLORS.textSecondary,
      fontFamily: FONTS.MEDIUM_PRIMARY,
    },
    chipTextActive: { color: COLORS.primary, fontFamily: FONTS.BOLD_PRIMARY },
    toggleCard: {
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      padding: 16,
      marginBottom: 16,
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    toggleLeft: { flexDirection: 'row', alignItems: 'center' },
    toggleTitle: {
      fontSize: 14,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
      color: COLORS.text,
    },
    toggleSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
    helpersCard: {
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      padding: 16,
      marginBottom: 16,
    },
    helpersHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    helpersTitle: {
      fontSize: 14,
      fontFamily: FONTS.BOLD_PRIMARY,
      color: COLORS.text,
    },
    helpersRate: {
      fontSize: 12,
      color: COLORS.primary,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
    },
    stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    stepperBtn: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.md,
      backgroundColor: COLORS.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperBtnText: {
      fontSize: 20,
      fontFamily: FONTS.BOLD_PRIMARY,
      color: COLORS.primary,
      lineHeight: 22,
    },
    stepperValue: {
      fontSize: 18,
      fontFamily: FONTS.BOLD_PRIMARY,
      color: COLORS.text,
      minWidth: 24,
      textAlign: 'center',
    },
    helpersTotal: {
      marginLeft: 'auto',
      fontSize: 14,
      fontFamily: FONTS.BOLD_PRIMARY,
      color: COLORS.text,
    },
    helpersError: { color: COLORS.danger, fontSize: 11, marginTop: 8 },
  });



const StepOrderDetails = ({
  data,
  onChange,
  onBack,
  allData,
  category,
  submitting,
  onSubmit,
  fareEstimate,
  areas,
  stops,
  onAddStop,
  onRemoveStop,
}: {
  data: OrderDetailsForm;
  onChange: <K extends keyof OrderDetailsForm>(
    key: K,
    val: OrderDetailsForm[K],
  ) => void;
  onBack: () => void;
  allData: AllOrderData;
  category: ShipmentCategory;
  submitting: boolean;
  onSubmit: () => void;
  fareEstimate: FareEstimate;
  areas: ServiceArea[];
  stops: { id: string; place: ServiceArea; landmark: string }[];
  onAddStop: (place: ServiceArea, landmark: string) => void;
  onRemoveStop: (id: string) => void;
}) => {
  const { colors: BRAND } = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
  const odStyles = useMemo(() => makeOdStyles(COLORS), [COLORS]);
  const user = useAuthStore(s => s.user);
  const { mutate: updatePreferredPaymentMode, isPending: savingPaymentPref } = useUpdateProfile();
  const { data: businessSettingsData } = useBusinessSettings();
  const expressSurcharge = Number(
    businessSettingsData?.find(s => s.key === 'service_type_express_surcharge')
      ?.value ?? 0,
  );
  const sameDaySurcharge = Number(
    businessSettingsData?.find(s => s.key === 'service_type_same_day_surcharge')
      ?.value ?? 0,
  );
  const SERVICE_TYPES = useMemo(
    () => makeServiceTypes(COLORS, expressSurcharge, sameDaySurcharge, t),
    [COLORS, expressSurcharge, sameDaySurcharge, t],
  );
  const PAYMENT_MODES = useMemo(() => makePaymentModes(t), [t]);
  const translatedSlots = useMemo(() => makePickupSlots(t), [t]);
  const {
    mutate: validatePromo,
    data: promoResult,
    isPending: validatingPromo,
    reset: resetPromoResult,
  } = useValidatePromoCode();
  const { data: activePromoCodes } = useActivePromoCodes();
  
  
  
  
  
  const { data: vehicleConfigsData } = useVehicleConfigs();
  
  
  
  
  const { results: activeVehicleConfigs, excludedForCapacity } =
    useVehicleSearch(vehicleConfigsData, {
      minCapacityKg:
        category === 'HOUSE_SHIFTING'
          ? undefined
          : safeNumber(allData.package.weight),
      excludeNames: category === 'HOUSE_SHIFTING' ? ['bike'] : undefined,
    });
  
  
  
  
  useEffect(() => {
    if (activeVehicleConfigs.length === 0) return;
    const stillValid = activeVehicleConfigs.some(
      v => v.name.toLowerCase() === data.vehicleType.toLowerCase(),
    );
    if (!stillValid) {
      onChange('vehicleType', activeVehicleConfigs[0].name.toLowerCase());
    }
    
  }, [activeVehicleConfigs, data.vehicleType, onChange]);
  const [stopDraftPlace, setStopDraftPlace] = useState<ServiceArea | null>(
    null,
  );
  const [stopDraftLandmark, setStopDraftLandmark] = useState('');
  const canAddMoreStops = stops.length < 10;
  // If the selected pickup slot's window has already passed (only
  
  
  
  useEffect(() => {
    if (data.scheduled) return;
    if (!isSlotPassed(data.pickupSlot)) return;
    const nextOpen = PICKUP_SLOTS.find(s => !isSlotPassed(s));
    if (nextOpen && nextOpen !== data.pickupSlot) {
      onChange('pickupSlot', nextOpen);
    }
    
  }, [data.scheduled, data.pickupSlot]);
  const handleAddStop = () => {
    if (!stopDraftPlace) return;
    onAddStop(stopDraftPlace, stopDraftLandmark);
    setStopDraftPlace(null);
    setStopDraftLandmark('');
  };
  // Was adding a flat ₹49/₹29 here for fragile/insurance — a fee that
  // was never actually charged (no payment gateway exists), just
  // silently baked into the displayed total. fragile/insuranceRequested
  // are now real, persisted flags (kalanabhaBackend 5f7763e) shown as
  // plain requests below, with no invented price attached to either.
  // Real, distance-based fare from the pickup/drop coordinates + the
  // selected vehicle's rate card. Was falling back to a flat guess
  
  
  
  
  const basePrice = fareEstimate.price;
  
  
  
  
  
  const promoDiscount =
    promoResult?.valid && data.promoCode.trim() ? promoResult.discount : 0;
  const total =
    basePrice != null ? Math.max(0, basePrice - promoDiscount) : null;

  return (
    <ScrollView
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
    >
      {}
      <SectionHeader
        title={t('addOrder.serviceTypeSectionTitle')}
        subtitle={t('addOrder.serviceTypeSectionSubtitle')}
      />
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
              <View style={odStyles.selectedBadge}>
                <Check size={12} color="#fff" strokeWidth={3} />
              </View>
            )}
            <Text style={odStyles.svcDays}>{svc.days}</Text>
            <Text style={[odStyles.svcLabel, { color: svc.color }]}>
              {svc.label}
            </Text>
            <Text style={odStyles.svcDesc}>{svc.desc}</Text>
            <Text
              style={[
                odStyles.svcPrice,
                data.serviceType === svc.key && { color: COLORS.primary },
              ]}
            >
              {svc.priceLabel}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {}
      <SectionHeader
        title={t('addOrder.vehicleTypeSectionTitle')}
        subtitle={t('addOrder.vehicleTypeSectionSubtitle')}
      />
      {activeVehicleConfigs.length === 0 && excludedForCapacity.length > 0 && (
        <Text style={odStyles.summKey}>
          {t('addOrder.noVehicleCanCarry', {
            weight: allData.package.weight,
            maxWeight: Math.max(...excludedForCapacity.map(v => v.maxWeight)),
          })}
        </Text>
      )}
      <VehicleSelectCards
        vehicles={activeVehicleConfigs}
        selectedName={data.vehicleType}
        onSelect={vt =>
          navigation.navigate('VehicleDetails', {
            vehicleId: vt.id,
            vehicles: activeVehicleConfigs,
            onConfirm: (v: typeof activeVehicleConfigs[number]) =>
              onChange('vehicleType', v.name.toLowerCase()),
          })
        }
      />
      {activeVehicleConfigs.length > 0 && (
        <TouchableOpacity
          style={odStyles.viewAllVehiclesBtn}
          onPress={() =>
            navigation.navigate('AllVehicles', {
              vehicles: activeVehicleConfigs,
              selectedName: data.vehicleType,
              onConfirm: (v: typeof activeVehicleConfigs[number]) =>
                onChange('vehicleType', v.name.toLowerCase()),
            })
          }
          activeOpacity={0.7}
        >
          <Text style={odStyles.viewAllVehiclesBtnText}>
            {t('addOrder.viewAndCompareVehicles')}
          </Text>
        </TouchableOpacity>
      )}

      {}
      <SectionHeader title={t('addOrder.paymentMethodSectionTitle')} />
      {PAYMENT_MODES.map(pm => (
        <TouchableOpacity
          key={pm.key}
          onPress={() => onChange('paymentMode', pm.key)}
          style={[
            odStyles.payRow,
            data.paymentMode === pm.key && odStyles.payRowActive,
          ]}
          activeOpacity={0.8}
        >
          <pm.icon
            color={
              data.paymentMode === pm.key
                ? COLORS.primary
                : COLORS.textSecondary
            }
            size={18}
            style={odStyles.payIcon}
          />
          <Text
            style={[
              odStyles.payLabel,
              data.paymentMode === pm.key && {
                color: COLORS.primary,
                fontFamily: FONTS.BOLD_PRIMARY,
              },
            ]}
          >
            {pm.label}
          </Text>
          <View
            style={[
              odStyles.radio,
              data.paymentMode === pm.key && odStyles.radioActive,
            ]}
          >
            {data.paymentMode === pm.key && <View style={odStyles.radioDot} />}
          </View>
        </TouchableOpacity>
      ))}
      {user?.preferredPaymentMode !== data.paymentMode && (
        <TouchableOpacity
          style={odStyles.setDefaultPaymentBtn}
          disabled={savingPaymentPref}
          onPress={() =>
            updatePreferredPaymentMode(
              { preferredPaymentMode: data.paymentMode },
              {
                onSuccess: () => showToast(t('addOrder.defaultPaymentSaved'), 'success'),
                onError: () => showToast(t('addOrder.defaultPaymentSaveFailed'), 'error'),
              },
            )
          }
        >
          <Text style={odStyles.setDefaultPaymentBtnText}>
            {savingPaymentPref ? t('addOrder.saving') : t('addOrder.setAsDefaultPayment')}
          </Text>
        </TouchableOpacity>
      )}

      {}
      <SectionHeader title={t('addOrder.promoCodeSectionTitle')} />
      {!!activePromoCodes?.length && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={odStyles.offersScroll}
        >
          {activePromoCodes.map(promo => (
            <TouchableOpacity
              key={promo.id}
              style={odStyles.offerChip}
              activeOpacity={0.8}
              onPress={() => {
                onChange('promoCode', promo.code);
                resetPromoResult();
                if (fareEstimate.price != null) {
                  validatePromo({
                    code: promo.code,
                    amount: fareEstimate.price,
                  });
                }
              }}
            >
              <Tag color={COLORS.primary} size={13} />
              <Text style={odStyles.offerChipCode}>{promo.code}</Text>
              <Text style={odStyles.offerChipDesc}>
                {promo.discountType === 'FLAT'
                  ? `-₹${promo.value}`
                  : `-${promo.value}%`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={odStyles.promoRow}>
        <View style={[odStyles.notesBox, { flex: 1, marginBottom: 0 }]}>
          <TextInput
            style={odStyles.notesInput}
            value={data.promoCode}
            onChangeText={v => {
              onChange('promoCode', v.toUpperCase());
              resetPromoResult();
            }}
            placeholder={t('addOrder.promoCodePlaceholder')}
            placeholderTextColor={COLORS.placeholder}
            autoCapitalize="characters"
          />
        </View>
        <TouchableOpacity
          style={odStyles.promoApplyBtn}
          disabled={
            !data.promoCode.trim() ||
            fareEstimate.price == null ||
            validatingPromo
          }
          onPress={() =>
            validatePromo({
              code: data.promoCode.trim(),
              amount: fareEstimate.price ?? 0,
            })
          }
          activeOpacity={0.8}
        >
          {validatingPromo ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Tag color="#fff" size={16} />
          )}
        </TouchableOpacity>
      </View>
      {promoResult && (
        <Text
          style={[
            odStyles.promoResultText,
            { color: promoResult.valid ? COLORS.success : COLORS.danger },
          ]}
        >
          {promoResult.valid
            ? t('addOrder.promoApplied', { discount: promoResult.discount })
            : promoResult.reason ?? t('addOrder.promoInvalid')}
        </Text>
      )}

      {}
      <SectionHeader
        title={t('addOrder.schedulePickupSectionTitle')}
        subtitle={t('addOrder.schedulePickupSectionSubtitle')}
      />
      <View style={odStyles.payRow}>
        <Calendar
          color={data.scheduled ? COLORS.primary : COLORS.textSecondary}
          size={18}
          style={odStyles.payIcon}
        />
        <Text
          style={[
            odStyles.payLabel,
            data.scheduled && {
              color: COLORS.primary,
              fontFamily: FONTS.BOLD_PRIMARY,
            },
          ]}
        >
          {t('addOrder.scheduleForLater')}
        </Text>
        <Switch
          value={data.scheduled}
          onValueChange={v => {
            onChange('scheduled', v);
            if (v && !data.scheduledAt) {
              onChange(
                'scheduledAt',
                new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              );
            }
          }}
          trackColor={{ true: COLORS.primary }}
        />
      </View>
      {data.scheduled && (
        <DateTimeChipPicker
          colors={{
            primary: COLORS.primary,
            primaryLight: COLORS.primaryLight,
            text: COLORS.text,
            textSecondary: COLORS.textSecondary,
            border: COLORS.border,
            surface: COLORS.surface,
          }}
          value={data.scheduledAt}
          onChange={iso => onChange('scheduledAt', iso)}
          t={t}
        />
      )}

      {}
      <SectionHeader
        title={t('addOrder.pickupTimeSlotSectionTitle')}
        subtitle={t('addOrder.pickupTimeSlotSectionSubtitle')}
      />
      <View style={odStyles.slotGrid}>
        {PICKUP_SLOTS.map((slot, i) => {
          const passed = !data.scheduled && isSlotPassed(slot);
          return (
            <TouchableOpacity
              key={slot}
              disabled={passed}
              onPress={() => onChange('pickupSlot', slot)}
              style={[
                odStyles.slotChip,
                data.pickupSlot === slot && odStyles.slotChipActive,
                passed && odStyles.slotChipDisabled,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  odStyles.slotText,
                  data.pickupSlot === slot && odStyles.slotTextActive,
                  passed && odStyles.slotTextDisabled,
                ]}
              >
                {translatedSlots[i]}
              </Text>
              {passed && (
                <Text style={odStyles.slotPassedTag}>{t('addOrder.slotPassed')}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {}
      <SectionHeader
        title={t('addOrder.deliveryInstructionsSectionTitle')}
        subtitle={t('addOrder.deliveryInstructionsSectionSubtitle')}
      />
      <View style={odStyles.slotGrid}>
        {DELIVERY_INSTRUCTION_OPTIONS.map(key => {
          const label = t(`addOrder.deliveryInstruction_${key}`);
          
          
          
          
          const isSelected = data.deliveryInstructions.includes(label);
          return (
            <TouchableOpacity
              key={key}
              onPress={() =>
                onChange(
                  'deliveryInstructions',
                  isSelected
                    ? data.deliveryInstructions.filter(l => l !== label)
                    : [...data.deliveryInstructions, label],
                )
              }
              style={[odStyles.slotChip, isSelected && odStyles.slotChipActive]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  odStyles.slotText,
                  isSelected && odStyles.slotTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {}
      <SectionHeader
        title={t('addOrder.stopsSectionTitle')}
        subtitle={t('addOrder.stopsSectionSubtitle')}
      />
      {stops.map((s, idx) => (
        <View key={s.id} style={odStyles.stopRow}>
          <View style={odStyles.stopBadge}>
            <Text style={odStyles.stopBadgeText}>{idx + 1}</Text>
          </View>
          <Text style={odStyles.stopText} numberOfLines={1}>
            {composeAddress(s.landmark, s.place)}
          </Text>
          <TouchableOpacity onPress={() => onRemoveStop(s.id)} hitSlop={8}>
            <Text style={odStyles.stopRemove}>{t('addOrder.removeStop')}</Text>
          </TouchableOpacity>
        </View>
      ))}
      {canAddMoreStops && (
        <>
          <PlacePicker
            label={t('addOrder.addStopLabel')}
            value={stopDraftPlace}
            areas={areas}
            onSelect={setStopDraftPlace}
            placeholder={t('addOrder.addStopPlaceholder')}
          />
          {stopDraftPlace && (
            <InputField
              label={t('addOrder.labelHouseFlatLandmark')}
              value={stopDraftLandmark}
              onChangeText={setStopDraftLandmark}
              placeholder={t('addOrder.placeholderPickupLandmark')}
              icon={MapPin}
            />
          )}
          <TouchableOpacity
            style={[
              odStyles.addStopBtn,
              !stopDraftPlace && odStyles.addStopBtnDisabled,
            ]}
            onPress={handleAddStop}
            disabled={!stopDraftPlace}
            activeOpacity={0.8}
          >
            <Text style={odStyles.addStopBtnText}>
              {t('addOrder.addStopButton')}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {}
      <SectionHeader
        title={t('addOrder.deliveryNotesSectionTitle')}
        subtitle={t('addOrder.deliveryNotesSectionSubtitle')}
      />
      <View style={odStyles.notesBox}>
        <TextInput
          style={odStyles.notesInput}
          value={data.notes}
          onChangeText={v => onChange('notes', v.slice(0, 500))}
          placeholder={t('addOrder.placeholderNotes')}
          placeholderTextColor={COLORS.placeholder}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={odStyles.notesCounter}>{data.notes.length}/500</Text>
      </View>

      {}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={odStyles.fareHero}
      >
        <View style={odStyles.fareHeroRow}>
          {(() => {
            const VehicleIcon = vehicleIconFor(data.vehicleType);
            return (
              <VehicleIcon
                color="#fff"
                size={34}
                style={odStyles.fareHeroIcon}
              />
            );
          })()}
          <View style={{ flex: 1 }}>
            <Text style={odStyles.fareHeroLabel}>
              {fareEstimate.loading
                ? t('addOrder.calculatingFare')
                : fareEstimate.error
                ? t('addOrder.unableToEstimate')
                : t('addOrder.estimatedFare')}
            </Text>
            {fareEstimate.loading ? (
              <ActivityIndicator
                color="#fff"
                style={{ alignSelf: 'flex-start', marginTop: 6 }}
              />
            ) : fareEstimate.error ? (
              
              
              
              <Text style={odStyles.fareHeroPrice}>—</Text>
            ) : (
              <Text style={odStyles.fareHeroPrice}>
                ₹{fareEstimate.price ?? 0}
              </Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            {fareEstimate.distanceKm != null && (
              <View style={odStyles.fareHeroChip}>
                <Text style={odStyles.fareHeroChipText}>
                  {fareEstimate.distanceKm} km
                </Text>
              </View>
            )}
            {}
            {fareEstimate.etaMinutes != null && (
              <View style={odStyles.fareHeroChip}>
                <Text style={odStyles.fareHeroChipText}>
                  {t('addOrder.etaChip', { minutes: fareEstimate.etaMinutes })}
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      {}
      <View style={odStyles.reviewSection}>
        <SectionHeader
          title={t('addOrder.orderSummarySectionTitle')}
          subtitle={t('addOrder.orderSummarySectionSubtitle')}
        />

        <View style={odStyles.summaryCard}>
          {}
          <View style={odStyles.routeBox}>
            <View style={odStyles.routePoint}>
              <View
                style={[odStyles.routeDot, { backgroundColor: COLORS.primary }]}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={odStyles.routeRole}>
                  {t('addOrder.routeLabelPickup')}
                </Text>
                <Text style={odStyles.routeName}>{allData.sender.name}</Text>
                {}
                <Text style={odStyles.routeAddr}>{allData.sender.address}</Text>
              </View>
            </View>
            <View style={odStyles.routeDashedLine} />
            <View style={odStyles.routePoint}>
              <View
                style={[odStyles.routeDot, { backgroundColor: COLORS.success }]}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={odStyles.routeRole}>
                  {t('addOrder.routeLabelDelivery')}
                </Text>
                <Text style={odStyles.routeName}>{allData.receiver.name}</Text>
                <Text style={odStyles.routeAddr}>
                  {allData.receiver.address}
                </Text>
              </View>
            </View>
          </View>

          <View style={odStyles.summDivider} />

          {}
          <View style={odStyles.summRow}>
            <Text style={odStyles.summKey}>
              {t('addOrder.summaryKeyPackage')}
            </Text>
            <Text style={odStyles.summVal}>
              {allData.package.category} · {allData.package.weight} kg
            </Text>
          </View>
          <View style={odStyles.summRow}>
            <Text style={odStyles.summKey}>
              {t('addOrder.summaryKeyQuantity')}
            </Text>
            <Text style={odStyles.summVal}>
              {t('addOrder.summaryQuantityValue', {
                qty: allData.package.quantity,
              })}
            </Text>
          </View>
          {allData.package.fragile && (
            <View style={odStyles.summRow}>
              <Text style={odStyles.summKey}>
                {t('addOrder.summaryKeyFragile')}
              </Text>
              <View style={odStyles.summValRow}>
                <AlertTriangle size={13} color={COLORS.warning} />
                <Text style={[odStyles.summVal, { color: COLORS.warning }]}>
                  {t('addOrder.summaryFragileValue')}
                </Text>
              </View>
            </View>
          )}
          {allData.package.insurance && (
            <View style={odStyles.summRow}>
              <Text style={odStyles.summKey}>
                {t('addOrder.summaryKeyInsurance')}
              </Text>
              <View style={odStyles.summValRow}>
                <Check size={13} color={COLORS.success} strokeWidth={3} />
                {}
                <Text style={[odStyles.summVal, { color: COLORS.success }]}>
                  {t('addOrder.summaryInsuranceValue')}
                </Text>
              </View>
            </View>
          )}
          <View style={odStyles.summRow}>
            <Text style={odStyles.summKey}>
              {t('addOrder.summaryKeyVehicle')}
            </Text>
            <Text style={odStyles.summVal}>
              {activeVehicleConfigs.find(
                v => v.name.toLowerCase() === data.vehicleType.toLowerCase(),
              )?.name ?? data.vehicleType}
            </Text>
          </View>
          <View style={odStyles.summRow}>
            <Text style={odStyles.summKey}>
              {t('addOrder.summaryKeyPickupSlot')}
            </Text>
            <Text style={odStyles.summVal}>
              {translatedSlots[PICKUP_SLOTS.indexOf(data.pickupSlot)] ??
                data.pickupSlot}
            </Text>
          </View>
          <View style={odStyles.summRow}>
            <Text style={odStyles.summKey}>
              {t('addOrder.summaryKeyPayment')}
            </Text>
            <Text style={odStyles.summVal}>
              {PAYMENT_MODES.find(p => p.key === data.paymentMode)?.label}
            </Text>
          </View>

          <View style={odStyles.summDivider} />

          {}
          {fareEstimate.error && (
            <View style={odStyles.fareErrorRow}>
              <AlertTriangle size={12} color={COLORS.warning} />
              {}
              <Text style={odStyles.fareError}>
                {t('addOrder.fareErrorSuffix', { error: fareEstimate.error })}
              </Text>
            </View>
          )}
          {}
          {category === 'HOUSE_SHIFTING' && !!fareEstimate.helperCost && (
            <View style={odStyles.summRow}>
              <Text style={odStyles.summKey}>
                {t('addOrder.summaryHelpersLabel', {
                  count: allData.package.helpersCount,
                })}
              </Text>
              <Text style={odStyles.summVal}>₹{fareEstimate.helperCost}</Text>
            </View>
          )}
          {}
          {!!fareEstimate.insurancePremium && (
            <View style={odStyles.summRow}>
              <Text style={odStyles.summKey}>
                {t('addOrder.summaryInsurancePremiumLabel')}
              </Text>
              <Text style={odStyles.summVal}>₹{fareEstimate.insurancePremium}</Text>
            </View>
          )}
          {!!fareEstimate.loadingHelpFee && (
            <View style={odStyles.summRow}>
              <Text style={odStyles.summKey}>{t('addOrder.summaryLoadingHelpLabel')}</Text>
              <Text style={odStyles.summVal}>₹{fareEstimate.loadingHelpFee}</Text>
            </View>
          )}
          {!!fareEstimate.unloadingHelpFee && (
            <View style={odStyles.summRow}>
              <Text style={odStyles.summKey}>{t('addOrder.summaryUnloadingHelpLabel')}</Text>
              <Text style={odStyles.summVal}>₹{fareEstimate.unloadingHelpFee}</Text>
            </View>
          )}
          {!!fareEstimate.packagingFee && (
            <View style={odStyles.summRow}>
              <Text style={odStyles.summKey}>{t('addOrder.summaryPackagingLabel')}</Text>
              <Text style={odStyles.summVal}>₹{fareEstimate.packagingFee}</Text>
            </View>
          )}
          {promoDiscount > 0 && (
            <View style={odStyles.summRow}>
              <Text style={[odStyles.summKey, { color: COLORS.success }]}>
                {t('addOrder.summaryPromoDiscountLabel', { code: data.promoCode.trim().toUpperCase() })}
              </Text>
              <Text style={[odStyles.summVal, { color: COLORS.success }]}>-₹{promoDiscount}</Text>
            </View>
          )}
          <View style={odStyles.totalRow}>
            <Text style={odStyles.totalLabel}>
              {t('addOrder.totalAmountLabel')}
            </Text>
            <Text style={odStyles.totalValue}>
              {total != null ? `₹${total}` : '—'}
            </Text>
          </View>
        </View>
      </View>

      <NavButtons
        onBack={onBack}
        onNext={onSubmit}
        nextLabel={
          fareEstimate.loading
            ? t('addOrder.buttonCalculatingFare')
            : fareEstimate.error
            ? t('addOrder.buttonFixAddress')
            : t('addOrder.buttonPlaceOrder')
        }
        loading={submitting || fareEstimate.loading}
        disabled={!!fareEstimate.error}
      />
    </ScrollView>
  );
};

const recentReceiverStyles = StyleSheet.create({
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: FONTS.MEDIUM_PRIMARY,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#FFE0C7',
    borderRadius: 12,
    backgroundColor: '#FFF7F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    maxWidth: 160,
  },
  chipText: { fontSize: 12, color: '#FF7518', fontFamily: FONTS.BOLD_PRIMARY },
});

const makeOdStyles = (COLORS: OrderColors) =>
  StyleSheet.create({
    stopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: RADIUS.md,
      paddingHorizontal: 12,
      height: 44,
      backgroundColor: COLORS.surface,
      marginBottom: 8,
    },
    stopBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: COLORS.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stopBadgeText: {
      fontSize: 11,
      fontFamily: FONTS.BOLD_PRIMARY,
      color: COLORS.primary,
    },
    stopText: { flex: 1, fontSize: 13, color: COLORS.text },
    stopRemove: {
      fontSize: 12,
      color: COLORS.danger,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
    },
    addStopBtn: {
      borderWidth: 1.5,
      borderColor: COLORS.primary,
      borderStyle: 'dashed',
      borderRadius: RADIUS.md,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    addStopBtnDisabled: { borderColor: COLORS.border },
    addStopBtnText: {
      fontSize: 13,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
      color: COLORS.primary,
    },
    viewAllVehiclesBtn: {
      alignSelf: 'flex-start',
      marginTop: 10,
      marginBottom: 4,
      paddingVertical: 6,
      paddingHorizontal: 2,
    },
    viewAllVehiclesBtnText: {
      fontSize: 13,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
      color: COLORS.primary,
      textDecorationLine: 'underline',
    },
    setDefaultPaymentBtn: {
      alignSelf: 'flex-start',
      marginTop: 8,
      marginBottom: 4,
      paddingVertical: 6,
    },
    setDefaultPaymentBtnText: {
      fontSize: 12,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
      color: COLORS.primary,
    },
    serviceRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
    serviceCard: {
      flex: 1,
      borderRadius: RADIUS.lg,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      backgroundColor: COLORS.surface,
      padding: 14,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    serviceCardActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primaryLight,
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    selectedBadge: {
      position: 'absolute',
      top: -8,
      right: -8,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: COLORS.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: COLORS.surface,
    },
    selectedBadgeText: {
      color: '#fff',
      fontSize: 9,
      fontFamily: FONTS.BOLD_PRIMARY,
    },
    svcDays: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
    svcLabel: { fontSize: 14, fontFamily: FONTS.BOLD_PRIMARY, marginBottom: 3 },
    svcDesc: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
    svcPrice: {
      fontSize: 14,
      fontFamily: FONTS.BOLD_PRIMARY,
      color: COLORS.text,
      marginTop: 8,
    },

    payRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: RADIUS.lg,
      padding: 16,
      marginBottom: 10,
      backgroundColor: COLORS.surface,
    },
    payRowActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primaryLight,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 2,
    },
    payIcon: {},
    payLabel: {
      flex: 1,
      fontSize: 15,
      color: COLORS.text,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: COLORS.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioActive: { borderColor: COLORS.primary },
    radioDot: {
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: COLORS.primary,
    },

    slotGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    slotChip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: RADIUS.md,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      backgroundColor: COLORS.surface,
    },
    slotChipActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primaryLight,
    },
    slotText: {
      fontSize: 12,
      color: COLORS.textSecondary,
      fontFamily: FONTS.MEDIUM_PRIMARY,
    },
    slotTextActive: { color: COLORS.primary, fontFamily: FONTS.BOLD_PRIMARY },
    slotChipDisabled: { opacity: 0.5, backgroundColor: COLORS.bg },
    slotTextDisabled: { color: COLORS.textMuted },
    slotPassedTag: {
      fontSize: 9,
      color: COLORS.danger,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
      marginTop: 2,
    },

    notesBox: {
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: RADIUS.md,
      padding: 12,
      backgroundColor: COLORS.surface,
      marginBottom: 20,
      minHeight: 80,
    },
    notesInput: { fontSize: 14, color: COLORS.text, lineHeight: 22 },
    notesCounter: {
      fontSize: 11,
      color: COLORS.textMuted,
      textAlign: 'right',
      marginTop: 4,
    },

    offersScroll: { marginBottom: 10 },
    offerChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1.5,
      borderColor: COLORS.primary,
      borderRadius: RADIUS.md,
      backgroundColor: COLORS.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
    },
    offerChipCode: {
      fontSize: 12,
      color: COLORS.primary,
      fontFamily: FONTS.BOLD_PRIMARY,
    },
    offerChipDesc: {
      fontSize: 12,
      color: COLORS.primary,
      fontFamily: FONTS.MEDIUM_PRIMARY,
    },

    promoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6,
    },
    promoApplyBtn: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.md,
      backgroundColor: COLORS.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    promoResultText: {
      fontSize: 12,
      fontFamily: FONTS.MEDIUM_PRIMARY,
      marginBottom: 16,
    },

    reviewSection: { marginTop: 8 },
    summaryCard: {
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      padding: 16,
      marginBottom: 8,
    },
    routeBox: { marginBottom: 12 },
    routePoint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    routeDot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
    routeRole: {
      fontSize: 9,
      fontFamily: FONTS.BOLD_PRIMARY,
      color: COLORS.textMuted,
      letterSpacing: 1,
    },
    routeName: {
      fontSize: 13,
      fontFamily: FONTS.BOLD_PRIMARY,
      color: COLORS.text,
      marginTop: 1,
    },
    routeAddr: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
    routeDashedLine: {
      width: 1,
      height: 16,
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: COLORS.border,
      marginLeft: 5,
      marginBottom: 4,
    },
    summDivider: {
      height: 1,
      backgroundColor: COLORS.border,
      marginVertical: 12,
    },
    summRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summKey: { fontSize: 13, color: COLORS.textSecondary },
    summVal: {
      fontSize: 13,
      color: COLORS.text,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
      maxWidth: '55%',
      textAlign: 'right',
    },
    summValRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: COLORS.primaryLight,
      borderRadius: RADIUS.md,
      padding: 12,
      marginTop: 4,
    },
    totalLabel: {
      fontSize: 14,
      fontFamily: FONTS.BOLD_PRIMARY,
      color: COLORS.primaryDark,
    },
    totalValue: {
      fontSize: 20,
      fontFamily: FONTS.BOLD_PRIMARY,
      color: COLORS.primary,
    },
    fareErrorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: -4,
      marginBottom: 8,
    },
    fareError: { fontSize: 11, color: COLORS.warning, flexShrink: 1 },

    
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
    fareHeroLabel: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
      letterSpacing: 0.3,
    },
    fareHeroPrice: {
      fontSize: 30,
      color: '#fff',
      fontFamily: FONTS.BOLD_PRIMARY,
      marginTop: 2,
    },
    fareHeroChip: {
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: RADIUS.full,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    fareHeroChipText: {
      color: '#fff',
      fontSize: 12,
      fontFamily: FONTS.BOLD_PRIMARY,
    },
  });



const SuccessModal = ({
  visible,
  trackingId,
  onDone,
  onViewOrder,
}: {
  visible: boolean;
  trackingId: string;
  onDone: () => void;
  onViewOrder: () => void;
}) => {
  const { colors: BRAND } = useAppTheme();
  const { t } = useTranslation();
  const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
  const successStyles = useMemo(() => makeSuccessStyles(COLORS), [COLORS]);
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fadeAnim, scaleAnim, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={successStyles.overlay}>
        <Animated.View
          style={[
            successStyles.card,
            { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
          ]}
        >
          <Illustration source={Images.illustrations.successOrderPlaced} size={170} />
          <Text style={successStyles.title}>{t('addOrder.successTitle')}</Text>
          <Text style={successStyles.subtitle}>
            {t('addOrder.successSubtitle')}
          </Text>

          <View style={successStyles.trackingBox}>
            <Text style={successStyles.trackingLabel}>
              {t('addOrder.trackingIdLabel')}
            </Text>
            <Text style={successStyles.trackingId}>{trackingId}</Text>
          </View>

          <Text style={successStyles.hint}>{t('addOrder.successHint')}</Text>

          <TouchableOpacity
            style={successStyles.viewOrderBtn}
            onPress={onViewOrder}
            activeOpacity={0.85}
          >
            <Text style={successStyles.viewOrderBtnText}>
              {t('addOrder.viewOrderButton')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={successStyles.doneBtn}
            onPress={onDone}
            activeOpacity={0.85}
          >
            <Text style={successStyles.doneBtnText}>
              {t('addOrder.goToHomeButton')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const makeSuccessStyles = (COLORS: OrderColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.xl,
      padding: 28,
      width: '100%',
      alignItems: 'center',
    },
    iconRing: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: COLORS.successLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 22,
      fontFamily: FONTS.BOLD_PRIMARY,
      color: COLORS.text,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: COLORS.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    trackingBox: {
      backgroundColor: COLORS.primaryLight,
      borderRadius: RADIUS.md,
      padding: 14,
      width: '100%',
      alignItems: 'center',
      marginBottom: 12,
    },
    trackingLabel: {
      fontSize: 11,
      color: COLORS.primary,
      fontFamily: FONTS.SEMI_BOLD_PRIMARY,
      letterSpacing: 1,
      marginBottom: 4,
    },
    trackingId: {
      fontSize: 20,
      fontFamily: FONTS.BOLD_PRIMARY,
      color: COLORS.primaryDark,
      letterSpacing: 2,
    },
    hint: {
      fontSize: 11,
      color: COLORS.textMuted,
      textAlign: 'center',
      marginBottom: 24,
    },
    viewOrderBtn: {
      backgroundColor: COLORS.primary,
      borderRadius: RADIUS.md,
      paddingVertical: 14,
      paddingHorizontal: 40,
      width: '100%',
      alignItems: 'center',
      marginBottom: 10,
    },
    viewOrderBtnText: {
      color: '#fff',
      fontSize: 15,
      fontFamily: FONTS.BOLD_PRIMARY,
    },
    doneBtn: {
      backgroundColor: 'transparent',
      borderRadius: RADIUS.md,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      paddingVertical: 14,
      paddingHorizontal: 40,
      width: '100%',
      alignItems: 'center',
    },
    doneBtnText: {
      color: COLORS.textSecondary,
      fontSize: 15,
      fontFamily: FONTS.BOLD_PRIMARY,
    },
  });



const StepHeader = ({
  current,
  total,
  onStepPress,
}: {
  current: number;
  total: number;
  onStepPress?: (step: number) => void;
}) => {
  const { colors: BRAND } = useAppTheme();
  const { t } = useTranslation();
  const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
  const STEPS = useMemo(() => makeSteps(t), [t]);
  const headerStyles = useMemo(() => makeHeaderStyles(COLORS), [COLORS]);
  const progress = (current / (total - 1)) * 100;
  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      style={headerStyles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={headerStyles.title}>{t('addOrder.headerTitle')}</Text>
      <Text style={headerStyles.subtitle}>
        {t('addOrder.stepProgress', {
          current: current + 1,
          total,
          description: STEPS[current].description,
        })}
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
                <TouchableOpacity
                  disabled={!done}
                  onPress={() => onStepPress?.(idx)}
                  hitSlop={8}
                  style={[
                    headerStyles.stepCircle,
                    done && headerStyles.stepDone,
                    active && headerStyles.stepActive,
                  ]}
                >
                  <Text
                    style={[
                      headerStyles.stepNum,
                      done && headerStyles.stepNumDone,
                      active && headerStyles.stepNumActive,
                    ]}
                  >
                    {done ? (
                      <Check size={16} color={COLORS.primary} strokeWidth={3} />
                    ) : (
                      step.icon
                    )}
                  </Text>
                </TouchableOpacity>
                <Text
                  style={[
                    headerStyles.stepLabel,
                    (done || active) && headerStyles.stepLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
              {idx < STEPS.length - 1 && (
                <View
                  style={[
                    headerStyles.connector,
                    done && headerStyles.connectorDone,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </LinearGradient>
  );
};

const makeHeaderStyles = (COLORS: OrderColors) =>
  StyleSheet.create({
    gradient: {
      paddingTop: Platform.OS === 'ios' ? 55 : 40,
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    title: {
      color: '#fff',
      fontSize: 22,
      fontFamily: FONTS.BOLD_PRIMARY,
      letterSpacing: 0.3,
    },
    subtitle: {
      color: 'rgba(255,255,255,0.65)',
      fontSize: 12,
      marginTop: 3,
      marginBottom: 14,
    },
    track: {
      height: 3,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 18,
    },
    fill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
    stepsRow: { flexDirection: 'row', alignItems: 'flex-start' },
    stepNode: { alignItems: 'center', width: 52 },
    stepCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.35)',
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepDone: { backgroundColor: '#fff', borderColor: '#fff' },
    stepActive: {
      backgroundColor: '#fff',
      borderColor: '#fff',
      shadowColor: '#fff',
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
    stepNum: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
    stepNumDone: { color: COLORS.primary, fontFamily: FONTS.BOLD_PRIMARY },
    stepNumActive: { color: COLORS.primary, fontFamily: FONTS.BOLD_PRIMARY },
    stepLabel: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.45)',
      marginTop: 4,
      fontFamily: FONTS.MEDIUM_PRIMARY,
    },
    stepLabelActive: { color: '#fff', fontFamily: FONTS.BOLD_PRIMARY },
    connector: {
      flex: 1,
      height: 2,
      backgroundColor: 'rgba(255,255,255,0.2)',
      marginTop: 17,
      borderRadius: 1,
    },
    connectorDone: { backgroundColor: '#fff' },
  });



const NewOrder = () => {
  const { colors: BRAND } = useAppTheme();
  const { t } = useTranslation();
  const COLORS = useMemo(() => makeOrderColors(BRAND), [BRAND]);
  const STEPS = useMemo(() => makeSteps(t), [t]);
  const mainStyles = useMemo(() => makeMainStyles(COLORS), [COLORS]);
  const navigation = useNavigation();
  
  
  
  
  const route = useRoute<any>();
  const prefill = route.params?.prefill as
    | {
        pickup?: string;
        drop?: string;
        vehicleType?: string;
        category?: ShipmentCategory;
      }
    | undefined;

  
  
  
  
  
  
  const user = useAuthStore(s => s.user);

  const [step, setStep] = useState(0);
  
  
  
  const [category, setCategory] = useState<ShipmentCategory>(
    prefill?.category ?? 'PARCEL',
  );
  const [sender, setSender] = useState<SenderForm>(() => ({
    ...INIT_SENDER,
    name: user?.displayName ?? INIT_SENDER.name,
    phone: user?.phone ?? INIT_SENDER.phone,
    email: user?.email ?? INIT_SENDER.email,
  }));
  const [receiver, setReceiver] = useState<ReceiverForm>(INIT_RECEIVER);

  
  
  
  
  
  
  
  const { data: serviceAreasData } = useServiceAreas();
  const activeAreas = useMemo(
    () => (serviceAreasData ?? []).filter(a => a.active),
    [serviceAreasData],
  );

  const [pickupPlace, setPickupPlace] = useState<ServiceArea | null>(null);
  const [dropPlace, setDropPlace] = useState<ServiceArea | null>(null);
  
  
  
  const [pickupRefine, setPickupRefine] = useState<
    (KnownCoords & { label: string }) | null
  >(null);
  const [dropRefine, setDropRefine] = useState<
    (KnownCoords & { label: string }) | null
  >(null);
  const [pkg, setPkg] = useState<PackageForm>(INIT_PACKAGE);
  
  
  
  
  
  const { data: shipmentHistoryForRepeat } = useMyShipmentHistory();
  const recentOrdersToRepeat = useMemo(
    () => (shipmentHistoryForRepeat ?? []).slice(0, 5),
    [shipmentHistoryForRepeat],
  );
  
  
  
  
  const [stops, setStops] = useState<
    { id: string; place: ServiceArea; landmark: string }[]
  >([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetailsForm>(() => ({
    ...INIT_ORDER,
    ...(prefill?.vehicleType
      ? { vehicleType: prefill.vehicleType as OrderDetailsForm['vehicleType'] }
      : null),
    // A saved preference (Profile > set via the payment step's "Save as
    // default") pre-selects this step instead of always defaulting to
    // prepaid — real stored data, not a fake remembered card/UPI method.
    ...(user?.preferredPaymentMode
      ? { paymentMode: user.preferredPaymentMode as OrderDetailsForm['paymentMode'] }
      : null),
  }));
  const [submitting, setSubmitting] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [createdShipmentId, setCreatedShipmentId] = useState('');
  // See handleSubmit's comment — one key per order attempt, reused
  
  
  const submitIdempotencyKeyRef = useRef<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { mutateAsync: payForShipment } = usePayForShipment();
  const { mutateAsync: createShipment } = useCreateShipment();
  // Dev-only "random test order" — see fillRandomTestOrder/the
  // auto-submit effect below, both gated behind __DEV__.
  const { data: devVehicleConfigs } = useVehicleConfigs();
  const [devAutoSubmitPending, setDevAutoSubmitPending] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  
  
  
  
  const pickupCoords: KnownCoords | null =
    pickupRefine ??
    (pickupPlace ? { lat: pickupPlace.lat, lng: pickupPlace.lng } : null);
  const dropCoords: KnownCoords | null =
    dropRefine ??
    (dropPlace ? { lat: dropPlace.lat, lng: dropPlace.lng } : null);

  
  
  
  const fareEstimate = useFareEstimate(
    sender.address ? `${sender.address}, ${sender.city}` : '',
    receiver.address ? `${receiver.address}, ${receiver.city}` : '',
    orderDetails.vehicleType,
    orderDetails.serviceType,
    pickupCoords,
    dropCoords,
    category,
    category === 'HOUSE_SHIFTING' ? pkg.helpersCount : undefined,
    pkg.insurance,
    pkg.loadingHelp,
    pkg.unloadingHelp,
    pkg.packaging,
  );

  
  
  
  
  const { data: businessSettingsData } = useBusinessSettings();
  const helperRate = useMemo(() => {
    const raw = businessSettingsData?.find(
      s => s.key === 'helper_rate_per_person',
    )?.value;
    return raw != null ? Number(raw) : null;
  }, [businessSettingsData]);

  
  
  
  
  
  useEffect(() => {
    if (activeAreas.length === 0) return;
    const matchFromText = (text?: string): ServiceArea | null => {
      if (!text) return null;
      const q = text.trim().toLowerCase();
      const matches = activeAreas.filter(a => q.includes(a.name.toLowerCase()));
      return matches.length === 1 ? matches[0] : null;
    };
    if (!pickupPlace) {
      const matched = matchFromText(prefill?.pickup);
      if (matched) {
        setPickupPlace(matched);
        setSender(prev => ({
          ...prev,
          address: composeAddress(prev.landmark, matched),
          city: matched.city,
          pincode: matched.pincode,
        }));
      }
    }
    if (!dropPlace) {
      const matched = matchFromText(prefill?.drop);
      if (matched) {
        setDropPlace(matched);
        setReceiver(prev => ({
          ...prev,
          address: composeAddress(prev.landmark, matched),
          city: matched.city,
          pincode: matched.pincode,
        }));
      }
    }
    
  }, [activeAreas, dropPlace, pickupPlace, prefill?.drop, prefill?.pickup]);

  
  
  
  
  
  
  useEffect(() => {
    registerFCMToken('customer');
  }, []);

  const animateToStep = useCallback(
    (nextStep: number, direction: 'forward' | 'back') => {
      const outX = direction === 'forward' ? -30 : 30;
      const inX = direction === 'forward' ? 30 : -30;

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: outX,
          duration: 130,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setStep(nextStep);
        slideAnim.setValue(inX);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 70,
            friction: 9,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [fadeAnim, slideAnim],
  );

  const goNext = useCallback(() => {
    if (step < STEPS.length - 1) animateToStep(step + 1, 'forward');
  }, [step, animateToStep, STEPS.length]);

  const goBack = useCallback(() => {
    if (step > 0) animateToStep(step - 1, 'back');
  }, [step, animateToStep]);

  
  
  
  
  
  const goToStep = useCallback((targetStep: number) => {
    if (targetStep < step) animateToStep(targetStep, 'back');
  }, [step, animateToStep]);

  
  
  
  
  
  const matchAreaForAddress = useCallback(
    (address: string): ServiceArea | null => {
      const q = address.trim().toLowerCase();
      const matches = activeAreas.filter(a => q.includes(a.name.toLowerCase()));
      return matches.length === 1 ? matches[0] : matches[0] ?? null;
    },
    [activeAreas],
  );

  const handleRepeatOrder = useCallback((past: import('@shipment/types').Shipment) => {
    setCategory((past.category as ShipmentCategory) ?? 'PARCEL');
    setSender(prev => ({
      ...prev,
      name: past.sender?.name || prev.name,
      phone: past.sender?.phone || prev.phone,
    }));
    setReceiver(prev => ({
      ...prev,
      name: past.receiver?.name ?? prev.name,
      phone: past.receiver?.phone ?? prev.phone,
    }));
    const pickupMatch = matchAreaForAddress(past.pickup.address);
    if (pickupMatch) {
      setPickupPlace(pickupMatch);
      setSender(prev => ({ ...prev, address: composeAddress(prev.landmark, pickupMatch), city: pickupMatch.city, pincode: pickupMatch.pincode }));
    }
    const dropMatch = matchAreaForAddress(past.drop.address);
    if (dropMatch) {
      setDropPlace(dropMatch);
      setReceiver(prev => ({ ...prev, address: composeAddress(prev.landmark, dropMatch), city: dropMatch.city, pincode: dropMatch.pincode }));
    }
    setPkg(prev => ({
      ...prev,
      description: past.goodsType || prev.description,
      weight: past.weightKg ? String(past.weightKg) : prev.weight,
      fragile: past.fragile,
      insurance: past.insuranceRequested,
      helpersCount: past.helpersCount || prev.helpersCount,
    }));
    setOrderDetails(prev => ({
      ...prev,
      vehicleType: past.vehicleType || prev.vehicleType,
      serviceType: (past.serviceType as OrderDetailsForm['serviceType']) || prev.serviceType,
      paymentMode: (past.paymentMode as OrderDetailsForm['paymentMode']) || prev.paymentMode,
    }));
    showToast(t('addOrder.repeatOrderFilled'), 'success');
    animateToStep(1, 'forward');
  }, [matchAreaForAddress, animateToStep, t]);

  
  
  
  
  const clearSubmitIdempotencyKey = useCallback(() => {
    submitIdempotencyKeyRef.current = null;
  }, []);

  const updateSender = useCallback(
    (key: keyof SenderForm, val: string) => {
      clearSubmitIdempotencyKey();
      setSender(prev => {
        const next = { ...prev, [key]: val };
        if (key === 'landmark') next.address = composeAddress(val, pickupPlace);
        return next;
      });
    },
    [pickupPlace, clearSubmitIdempotencyKey],
  );

  const updateReceiver = useCallback(
    (key: keyof ReceiverForm, val: string) => {
      clearSubmitIdempotencyKey();
      setReceiver(prev => {
        const next = { ...prev, [key]: val };
        if (key === 'landmark') next.address = composeAddress(val, dropPlace);
        return next;
      });
    },
    [dropPlace, clearSubmitIdempotencyKey],
  );

  const selectPickupPlace = useCallback(
    (p: ServiceArea) => {
      clearSubmitIdempotencyKey();
      setPickupPlace(p);
      setPickupRefine(null); 
      setSender(prev => ({
        ...prev,
        address: composeAddress(prev.landmark, p),
        city: p.city,
        pincode: p.pincode,
      }));
    },
    [clearSubmitIdempotencyKey],
  );

  const selectDropPlace = useCallback(
    (p: ServiceArea) => {
      clearSubmitIdempotencyKey();
      setDropPlace(p);
      setDropRefine(null);
      setReceiver(prev => ({
        ...prev,
        address: composeAddress(prev.landmark, p),
        city: p.city,
        pincode: p.pincode,
      }));
    },
    [clearSubmitIdempotencyKey],
  );

  const updatePkg = useCallback(
    <K extends keyof PackageForm>(key: K, val: PackageForm[K]) => {
      clearSubmitIdempotencyKey();
      setPkg(prev => ({ ...prev, [key]: val }));
    },
    [clearSubmitIdempotencyKey],
  );

  const updateOrderDetails = useCallback(
    <K extends keyof OrderDetailsForm>(key: K, val: OrderDetailsForm[K]) => {
      clearSubmitIdempotencyKey();
      setOrderDetails(prev => ({ ...prev, [key]: val }));
    },
    [clearSubmitIdempotencyKey],
  );

  // Dev-only: fills every step with real, valid random data (two distinct
  // real service areas, a real active vehicle type) and flags
  // devAutoSubmitPending — the effect below waits for the resulting fare
  // estimate to resolve, then calls handleSubmit itself, so one tap
  // produces a real created shipment without stepping through the wizard.
  const fillRandomTestOrder = useCallback(() => {
    if (activeAreas.length < 2) {
      showToast('Need at least 2 active service areas to create a random test order', 'error');
      return;
    }
    const shuffledAreas = [...activeAreas].sort(() => Math.random() - 0.5);
    const pickupArea = shuffledAreas[0];
    const dropArea = shuffledAreas[1];
    const activeDevVehicles = (devVehicleConfigs ?? []).filter(v => v.active);
    const randomVehicle =
      activeDevVehicles.length > 0
        ? activeDevVehicles[Math.floor(Math.random() * activeDevVehicles.length)]
        : null;

    setCategory('PARCEL');
    setSender(prev => ({
      ...prev,
      name: randomDevName(),
      phone: randomDevPhone(),
      email: `test.sender.${Date.now()}@example.com`,
      landmark: '',
    }));
    setReceiver({
      name: randomDevName(),
      phone: randomDevPhone(),
      email: `test.receiver.${Date.now()}@example.com`,
      landmark: '',
      address: '',
      city: '',
      pincode: '',
    });
    selectPickupPlace(pickupArea);
    selectDropPlace(dropArea);
    setPkg(prev => ({
      ...prev,
      weight: String(Math.floor(Math.random() * 20) + 1),
      quantity: '1',
    }));
    if (randomVehicle) {
      setOrderDetails(prev => ({ ...prev, vehicleType: randomVehicle.name.toLowerCase() }));
    }
    // A driver only sees this in their Searching list if their own
    // vehicleType matches exactly (DispatchService's eligibility guard,
    // mirrored by useSearchingShipments' query) — the single most common
    // reason a freshly-booked test order "doesn't reach the driver" is
    // this not matching the test driver account's vehicle, not a bug.
    showToast(
      `Booked as ${randomVehicle?.name ?? orderDetails.vehicleType} — the test driver account needs that same vehicle type to see it in Searching`,
      'info',
    );
    setDevAutoSubmitPending(true);
  }, [activeAreas, devVehicleConfigs, selectPickupPlace, selectDropPlace, orderDetails.vehicleType]);

  const addStop = useCallback(
    (place: ServiceArea, landmark: string) => {
      clearSubmitIdempotencyKey();
      setStops(prev => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          place,
          landmark,
        },
      ]);
    },
    [clearSubmitIdempotencyKey],
  );

  const removeStop = useCallback(
    (id: string) => {
      clearSubmitIdempotencyKey();
      setStops(prev => prev.filter(s => s.id !== id));
    },
    [clearSubmitIdempotencyKey],
  );

  const allData: AllOrderData = useMemo(
    () => ({
      sender,
      receiver,
      package: pkg,
      orderDetails,
    }),
    [sender, receiver, pkg, orderDetails],
  );

  
  
  
  
  const handleSubmit = useCallback(async (): Promise<void> => {
    const scope = 'CREATE_SHIPMENT';
    
    
    
    
    
    
    
    
    
    
    
    if (!submitIdempotencyKeyRef.current) {
      submitIdempotencyKeyRef.current = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
    }
    const idempotencyKey = submitIdempotencyKeyRef.current;

    try {
      log(scope, 'START');
      setSubmitting(true);

      if (
        !fareEstimate.pickup ||
        !fareEstimate.drop ||
        fareEstimate.price == null
      ) {
        showToast(t('addOrder.alertFareNotReadyMessage'), 'error');
        return;
      }

      const isHouseShifting = category === 'HOUSE_SHIFTING';

      const shipment = await createShipment({
        payload: {
          
          
          
          goodsType: isHouseShifting
            ? 'House Shifting'
            : pkg?.category ?? 'General',
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
          
          
          
          
          
          notes:
            isHouseShifting && pkg?.description
              ? `Items: ${pkg.description}${
                  orderDetails.notes ? ` — ${orderDetails.notes}` : ''
                }`
              : orderDetails.notes,
          category,
          helpersCount: isHouseShifting ? pkg.helpersCount : undefined,
          fragile: pkg.fragile,
          insuranceRequested: pkg.insurance,
          loadingHelpRequested: pkg.loadingHelp,
          unloadingHelpRequested: pkg.unloadingHelp,
          packagingRequested: pkg.packaging,
          promoCode: orderDetails.promoCode.trim() || undefined,
          scheduledAt:
            orderDetails.scheduled && orderDetails.scheduledAt
              ? orderDetails.scheduledAt
              : undefined,
          deliveryInstructions:
            orderDetails.deliveryInstructions.length > 0
              ? orderDetails.deliveryInstructions
              : undefined,
          stops:
            stops.length > 0
              ? stops.map(s => ({
                  address: composeAddress(s.landmark, s.place),
                  lat: s.place.lat,
                  lng: s.place.lng,
                }))
              : undefined,
        },
        idempotencyKey,
      });

      submitIdempotencyKeyRef.current = null;
      setTrackingId(shipment.trackingId);
      setCreatedShipmentId(shipment.id);
      setShowSuccess(true);

      
      
      
      
      if (
        orderDetails.paymentMode === 'prepaid' &&
        shipment.paymentStatus === 'PENDING'
      ) {
        try {
          await payForShipment({
            shipmentId: shipment.id,
            customerName: sender.name,
            customerEmail: sender.email,
            customerPhone: sender.phone,
          });
        } catch (payErr) {
          logError('PAY_FOR_SHIPMENT', payErr);
        }
      }

      log(scope, 'SUCCESS', { id: shipment.id });
    } catch (err: unknown) {
      logError(scope, err);
      showToast(normalizeError(err), 'error');
    } finally {
      setSubmitting(false);
      log(scope, 'END');
    }
  }, [
    sender,
    receiver,
    pkg,
    orderDetails,
    stops,
    fareEstimate,
    category,
    t,
    createShipment,
    payForShipment,
  ]);

  // fillRandomTestOrder above sets state and flips this flag; the fare
  // estimate it depends on resolves asynchronously (debounced network
  // call), so submission has to wait here rather than firing immediately.
  useEffect(() => {
    if (!devAutoSubmitPending || fareEstimate.loading) return;
    setDevAutoSubmitPending(false);
    if (fareEstimate.price == null) {
      showToast('Could not get a fare for the random test order — try again', 'error');
      return;
    }
    handleSubmit();
  }, [devAutoSubmitPending, fareEstimate.loading, fareEstimate.price, handleSubmit]);

  const handleDone = useCallback(() => {
    setShowSuccess(false);
    navigation.goBack();
  }, [navigation]);

  
  
  
  const handleViewOrder = useCallback(() => {
    setShowSuccess(false);
    (navigation as any).navigate('ShipmentDetailsScreen', {
      id: createdShipmentId,
    });
  }, [navigation, createdShipmentId]);

  return (
    <View style={mainStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {}
      <StepHeader current={step} total={STEPS.length} onStepPress={goToStep} />

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
              recentOrders={recentOrdersToRepeat}
              onRepeatOrder={handleRepeatOrder}
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
              areas={activeAreas}
              stops={stops}
              onAddStop={addStop}
              onRemoveStop={removeStop}
            />
          )}
        </Animated.View>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={showSuccess}
        trackingId={trackingId}
        onDone={handleDone}
        onViewOrder={handleViewOrder}
      />

      {__DEV__ && (
        <TouchableOpacity
          style={mainStyles.devRandomOrderBtn}
          onPress={fillRandomTestOrder}
          disabled={submitting || devAutoSubmitPending}
          activeOpacity={0.8}
        >
          <Text style={mainStyles.devRandomOrderBtnText}>
            {devAutoSubmitPending || submitting ? 'Booking…' : '🧪 Book Random Order'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default NewOrder;

const makeMainStyles = (COLORS: OrderColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bg },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    devRandomOrderBtn: {
      position: 'absolute',
      right: 16,
      bottom: 24,
      backgroundColor: '#111827',
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
    devRandomOrderBtnText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
  });
