import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Animated,
    StatusBar,
    Pressable,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { MapPin, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { H, S, RF, W } from '@utils/responsive';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';

import InputField from '@components/InputField';
import UserTypeSelector, { UserType } from '@components/UserTypeSelector';
import AppButton from '@components/AppButton';

import { useRegister } from '@hooks/useRegister';
import { useAutoAddress } from '@location/useAutoAddress';
import { signupSchema } from '@validation/authSchema';
import { normalizeError } from '@utils/error';
import { useAlert } from '@ui/alert/useAlert';
import AlertBanner from '@ui/alert/AlertBanner';
import { Illustration } from '@components/Illustration';
import { Images } from '@assets/images';

type FormState = {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM: FormState = {
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
};

const STEPS = [
    { label: 'Personal', fields: ['name', 'email', 'phone'] as (keyof FormState)[] },
    { label: 'Location', fields: ['address'] as (keyof FormState)[] },
    { label: 'Security', fields: ['password', 'confirmPassword'] as (keyof FormState)[] },
];

const Signup = () => {
    const { colors, fonts, isDark } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts), [colors, fonts]);
    const { t } = useTranslation();
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [errors, setErrors] = useState<FormErrors>({});
    const [type, setType] = useState<UserType>('HOME');
    
    
    
    
    const [referralCode, setReferralCode] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
        ]).start();
    }, []);

    const navigation = useNavigation();
    const { alert, show, clear } = useAlert();
    const { mutate, isPending } = useRegister();
    const { getAddress } = useAutoAddress();

    const update = useCallback((key: keyof FormState, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setErrors(prev => ({ ...prev, [key]: undefined }));
    }, []);

    const validate = useCallback((): boolean => {
        const result = signupSchema.safeParse(form);
        if (result.success) { setErrors({}); return true; }
        // zod's own issue.message is always English (built-in defaults like
        
        
        
        
        const FIELD_MESSAGE_KEY: Record<keyof FormState, string> = {
            name: 'signup.validationName',
            email: 'signup.validationEmail',
            phone: 'signup.validationPhone',
            address: 'signup.validationAddress',
            password: 'signup.validationPassword',
            confirmPassword: 'signup.validationConfirmPassword',
        };
        const fieldErrors: FormErrors = {};
        result.error.issues.forEach(issue => {
            const field = issue.path[0] as keyof FormState;
            fieldErrors[field] = t(FIELD_MESSAGE_KEY[field]);
        });
        setErrors(fieldErrors);
        return false;
    }, [form, t]);

    const isDisabled = useMemo(() =>
        isPending || Object.values(form).some(v => !v) || !acceptedTerms,
        [form, isPending, acceptedTerms]
    );

    
    
    
    
    const handleSubmit = useCallback(() => {
        clear();

        if (!validate()) {
            show(t('signup.fixHighlighted'));
            return;
        }

        mutate(
            {
                email: form.email.trim().toLowerCase(),
                password: form.password,
                displayName: form.name.trim(),
                role: 'customer',
                referralCode: referralCode.trim() || undefined,
                phone: form.phone.trim(),
                address: form.address.trim(),
                customerType: type,
            },
            {
                onSuccess: () => {
                    show(t('signup.accountCreated'), 'success');
                },
                onError: (err) => {
                    show(normalizeError(err));
                },
            }
        );
    }, [form, mutate, validate, show, clear, t, referralCode]);

    const handleLocation = useCallback(() => {
        getAddress(address => {
            if (address) update('address', address);
            else show(t('signup.unableToFetchLocation'));
        });
    }, [getAddress, update, show, t]);

    const isLoading = isPending;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.select({ ios: 'padding' })}
        >
            <StatusBar barStyle="light-content" backgroundColor={colors.PRIMARY} />
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {}
                <LinearGradient
                    colors={[colors.PRIMARY, colors.PRIMARY_DARK]}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
                        <Illustration source={Images.illustrations.signupHero} size={150} />
                        <Text style={styles.headerTitle}>{t('signup.createAccount')}</Text>
                        <Text style={styles.headerSubtitle}>{t('signup.joinKalanabha')}</Text>
                    </Animated.View>
                </LinearGradient>

                {}
                <Animated.View
                    style={[
                        styles.card,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    <AlertBanner alert={alert} />

                    {}
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionDot} />
                        <Text style={styles.sectionTitle}>{t('signup.personalInfo')}</Text>
                    </View>

                    <InputField
                        label={t('signup.fullName')}
                        placeholder={t('signup.fullNamePlaceholder')}
                        value={form.name}
                        onChange={v => update('name', v)}
                        error={errors.name}
                    />
                    <InputField
                        label={t('login.email')}
                        placeholder={t('login.emailPlaceholder')}
                        value={form.email}
                        onChange={v => update('email', v)}
                        error={errors.email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <InputField
                        label={t('signup.phone')}
                        placeholder={t('signup.phonePlaceholder')}
                        value={form.phone}
                        onChange={v => update('phone', v)}
                        error={errors.phone}
                        keyboardType="phone-pad"
                    />

                    {}
                    <View style={[styles.sectionHeader, { marginTop: H(16) }]}>
                        <View style={styles.sectionDot} />
                        <Text style={styles.sectionTitle}>{t('signup.location')}</Text>
                    </View>

                    <InputField
                        label={t('signup.address')}
                        placeholder={t('signup.addressPlaceholder')}
                        value={form.address}
                        onChange={v => update('address', v)}
                        error={errors.address}
                    />
                    <Pressable style={styles.locationLinkRow} onPress={handleLocation}>
                        <MapPin size={14} color={colors.PRIMARY} />
                        <Text style={styles.locationLink}>{t('signup.useCurrentLocation')}</Text>
                    </Pressable>

                    <UserTypeSelector value={type} onChange={setType} />

                    {}
                    <View style={[styles.sectionHeader, { marginTop: H(16) }]}>
                        <View style={styles.sectionDot} />
                        <Text style={styles.sectionTitle}>{t('signup.security')}</Text>
                    </View>

                    <InputField
                        label={t('login.password')}
                        placeholder={t('signup.passwordPlaceholder')}
                        secure
                        value={form.password}
                        onChange={v => update('password', v)}
                        error={errors.password}
                    />
                    <InputField
                        label={t('signup.confirmPassword')}
                        placeholder={t('signup.confirmPasswordPlaceholder')}
                        secure
                        value={form.confirmPassword}
                        onChange={v => update('confirmPassword', v)}
                        error={errors.confirmPassword}
                    />
                    <InputField
                        label={t('signup.referralCodeOptional')}
                        placeholder={t('signup.referralCodePlaceholder')}
                        value={referralCode}
                        onChange={v => setReferralCode(v.toUpperCase())}
                        autoCapitalize="characters"
                    />

                    <Pressable
                        style={styles.termsRow}
                        onPress={() => setAcceptedTerms(v => !v)}
                        hitSlop={8}
                    >
                        <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                            {acceptedTerms && <Check size={13} color="#fff" strokeWidth={3} />}
                        </View>
                        <Text style={styles.termsText}>
                            {t('signup.acceptTermsPrefix')}{' '}
                            <Text
                                style={styles.termsLink}
                                onPress={() => (navigation as any).navigate('WebView', { url: 'https://kalanabhalogistics.com/terms', title: t('settings.termsOfService') })}
                            >
                                {t('settings.termsOfService')}
                            </Text>
                            {' '}{t('signup.acceptTermsAnd')}{' '}
                            <Text
                                style={styles.termsLink}
                                onPress={() => (navigation as any).navigate('WebView', { url: 'https://kalanabhalogistics.com/privacy', title: t('settings.privacyPolicy') })}
                            >
                                {t('settings.privacyPolicy')}
                            </Text>
                        </Text>
                    </Pressable>

                    <View style={styles.submitWrapper}>
                        <AppButton
                            title={t('signup.createAccount')}
                            onPress={handleSubmit}
                            loading={isLoading}
                            disabled={isDisabled}
                        />
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default Signup;



const makeStyles = (colors: ReturnType<typeof useAppTheme>['colors'], fonts: ReturnType<typeof useAppTheme>['fonts']) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.BACKGROUND,
    },
    content: {
        paddingBottom: H(40),
    },
    header: {
        paddingTop: H(55),
        paddingBottom: H(35),
        paddingHorizontal: S(24),
        borderBottomLeftRadius: W(28),
        borderBottomRightRadius: W(28),
    },
    headerBadge: {
        width: W(52),
        height: W(52),
        borderRadius: W(16),
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: H(12),
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    badgeText: {
        fontSize: RF(24),
        color: '#fff',
        fontFamily: fonts.BOLD_PRIMARY,
    },
    headerTitle: {
        fontSize: RF(24),
        fontFamily: fonts.BOLD_PRIMARY,
        color: '#fff',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: RF(13),
        color: 'rgba(255,255,255,0.7)',
        marginTop: H(4),
    },
    card: {
        backgroundColor: colors.SURFACE,
        marginHorizontal: S(16),
        marginTop: H(-16),
        borderRadius: W(20),
        padding: S(20),
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 6,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: H(12),
        marginTop: H(4),
    },
    sectionDot: {
        width: S(4),
        height: H(18),
        borderRadius: 2,
        backgroundColor: colors.PRIMARY,
        marginRight: S(10),
    },
    sectionTitle: {
        fontSize: RF(14),
        fontFamily: fonts.MEDIUM_PRIMARY,
        color: colors.TEXT_PRIMARY,
        letterSpacing: 0.3,
    },
    locationLinkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: H(4),
        marginBottom: H(12),
    },
    locationLink: {
        color: colors.PRIMARY,
        fontFamily: fonts.MEDIUM_PRIMARY,
        fontSize: RF(13),
    },
    submitWrapper: {
        marginTop: H(20),
    },
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: S(10),
        marginTop: H(18),
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: colors.BORDER,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    checkboxChecked: {
        backgroundColor: colors.PRIMARY,
        borderColor: colors.PRIMARY,
    },
    termsText: {
        flex: 1,
        fontSize: RF(12.5),
        fontFamily: fonts.PRIMARY,
        color: colors.TEXT_SECONDARY,
        lineHeight: RF(18),
    },
    termsLink: {
        color: colors.PRIMARY,
        fontFamily: fonts.SEMI_BOLD_PRIMARY,
    },
});