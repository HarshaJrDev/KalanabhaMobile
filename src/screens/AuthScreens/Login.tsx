/**
 * Login.tsx  ─  Modified
 *
 * Changes vs original:
 *  1. Shows driver-specific UI when isDriver === true
 *  2. Registers FCM token on successful login (customer or driver)
 *  3. Pulls driver's pre-created credentials hint from Firestore
 *     (admin creates the account; driver enters their email/password)
 *  4. Visual polish: animated gradient header, smoother card entrance
 *  5. "Forgot credentials? Contact admin" message for drivers
 *     (since drivers can't reset password themselves — admin manages it)
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Truck, AlertTriangle, Check } from 'lucide-react-native';

import { H, S, W, RF } from '@utils/responsive';
import { useAppTheme } from '@theme/ThemeContext';

import InputField from '@components/InputField';
import AppButton from '@components/AppButton';
import { CustomLoader } from '@components/CustomLoader';
import { useLogin } from '@hooks/useLogin';

import { getApp } from '@react-native-firebase/app';
import { getMessaging, requestPermission, getToken, AuthorizationStatus } from '@react-native-firebase/messaging';
import { apiClient } from '@api/client';

import { RootStackParamList } from '../navigation/types';
import FONTS from '@utils/fonts';

// ─── FCM token registration (backend, not Firestore) ──────────────────────────
// Mirrors utils/cm.ts::registerFCMToken — PATCH /users/me/fcm-token.
// Modular API — the namespaced `messaging()` call style is deprecated as of
// RNFirebase v22 and logs a console warning on every use.
// See https://rnfirebase.io/migrating-to-v22.
const saveFCMToken = async () => {
    try {
        const messaging = getMessaging(getApp());
        const status = await requestPermission(messaging);
        const enabled =
            status === AuthorizationStatus.AUTHORIZED ||
            status === AuthorizationStatus.PROVISIONAL;
        if (!enabled) return;
        const token = await getToken(messaging);
        if (!token) return;
        await apiClient.patch('/users/me/fcm-token', { fcmToken: token });
    } catch (e) {
        // Non-critical — silently ignore
    }
};

// ─── Social login options (customer only) ────────────────────────────────────
const SOCIAL_LOGINS = [
    {
        name: 'Google',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
    },
    {
        name: 'Facebook',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png',
    },
];

// Dev-only convenience — pre-fills the seeded backend test accounts
// (kalanabhaBackend/prisma/seeders/index.ts) so login doesn't need to be
// typed by hand on every reload while developing. Never active in a
// release build.
const DEV_CREDENTIALS = {
    customer: { email: 'harsha.customer@kalanabha.com', password: 'Kalanabha@123' },
    driver: { email: 'driver@kalanabha.test', password: 'Driver@123' },
} as const;

// ─── Component ───────────────────────────────────────────────────────────────
const Login = () => {
    const { colors, fonts, isDark } = useAppTheme();
    const styles = useMemo(() => makeStyles(colors, fonts), [colors, fonts]);
    const route = useRoute<RouteProp<RootStackParamList, 'Login'>>();
    const isDriver = route.params?.isDriver ?? false;

    const devCreds = __DEV__ ? (isDriver ? DEV_CREDENTIALS.driver : DEV_CREDENTIALS.customer) : null;

    const [email, setEmail] = useState(devCreds?.email ?? '');
    const [password, setPassword] = useState(devCreds?.password ?? '');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const cardSlide = useRef(new Animated.Value(30)).current;

    const navigation = useNavigation();
    const { mutate, isPending } = useLogin();

    // Entrance animation
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 9, useNativeDriver: true }),
            Animated.spring(logoScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
            Animated.spring(cardSlide, { toValue: 0, tension: 55, friction: 8, delay: 120, useNativeDriver: true }),
        ]).start();
    }, []);

    // ── Login handler ──────────────────────────────────────────────────────────
    const handleLogin = useCallback(() => {
        setError(null);

        if (!email?.trim() || !password?.trim()) {
            setError('Email and password are required');
            return;
        }

        setLoading(true);

        mutate(
            { email: email.trim().toLowerCase(), password: password.trim() },
            {
                onSuccess: () => {
                    // Navigation itself is handled declaratively by App.tsx
                    // once the role lands in the auth store — see the
                    // `showAppFlow`/`initialRouteName` comment there for why
                    // this screen must NOT call navigation.reset() itself
                    // (doing so used to race the auth-flow -> app-flow
                    // screen-set swap and always lose to "Home").
                    saveFCMToken();
                },

                onError: (err) => {
                    // ApiError.message already carries the backend's message
                    // (AuthService throws "Invalid credentials" for both a
                    // wrong email and a wrong password, matching the backend
                    // deliberately not distinguishing the two).
                    setError(err.message);
                },

                onSettled: () => setLoading(false),
            }
        );
    }, [email, password, mutate]);

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.select({ ios: 'padding' })}
        >
            <StatusBar barStyle="light-content" backgroundColor={isDriver ? '#1e293b' : colors.PRIMARY} />

            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero header ── */}
                <LinearGradient
                    colors={isDriver ? ['#1e293b', '#0f172a'] : [colors.PRIMARY, colors.PRIMARY_DARK]}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {/* Decorative circles */}
                    <View style={styles.decorCircle1} />
                    <View style={styles.decorCircle2} />

                    <Animated.View style={{ transform: [{ scale: logoScale }] }}>
                        <View style={[styles.logoBadge, isDriver && styles.logoBadgeDriver]}>
                            {isDriver ? (
                                <Truck color="#fff" size={RF(30)} />
                            ) : (
                                <Text style={styles.logoText}>K</Text>
                            )}
                        </View>
                    </Animated.View>

                    <Animated.View
                        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}
                    >
                        <Text style={styles.brandName}>Kalanabha</Text>
                        <Text style={styles.tagline}>
                            {isDriver ? 'Driver Portal' : 'Logistics, Simplified.'}
                        </Text>
                    </Animated.View>
                </LinearGradient>

                {/* ── Card ── */}
                <Animated.View
                    style={[
                        styles.card,
                        { opacity: fadeAnim, transform: [{ translateY: cardSlide }] },
                    ]}
                >
                    <Text style={styles.title}>
                        {isDriver ? 'Driver Login' : 'Welcome Back'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {isDriver
                            ? 'Sign in with the credentials your admin provided'
                            : 'Sign in to track and manage shipments'}
                    </Text>

                    {/* Driver info banner */}
                    {isDriver && (
                        <View style={styles.driverBanner}>
                            <Text style={styles.driverBannerIcon}>ℹ️</Text>
                            <Text style={styles.driverBannerText}>
                                Your login credentials were created by the Kalanabha admin.
                                Use the email and password they sent you.
                            </Text>
                        </View>
                    )}

                    {/* Fields */}
                    <InputField
                        label="Email address"
                        placeholder={isDriver ? 'your-email@kalanabha.com' : 'your@email.com'}
                        value={email}
                        onChange={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <InputField
                        label="Password"
                        placeholder="Enter your password"
                        secure
                        value={password}
                        onChange={setPassword}
                    />

                    {/* Error */}
                    {error ? (
                        <View style={styles.errorBox}>
                            <AlertTriangle color="#DC2626" size={RF(13)} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Remember me + Forgot */}
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={styles.rememberContainer}
                            onPress={() => setRememberMe(prev => !prev)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                                {rememberMe && <Check color="#fff" size={RF(12)} strokeWidth={3} />}
                            </View>
                            <Text style={styles.rememberText}>Remember me</Text>
                        </TouchableOpacity>

                        {isDriver ? (
                            // Drivers contact admin for password reset
                            <TouchableOpacity
                                onPress={() =>
                                    Alert.alert(
                                        'Forgot credentials?',
                                        'Please contact your Kalanabha admin to reset your password or get new credentials.',
                                        [{ text: 'OK' }]
                                    )
                                }
                            >
                                <Text style={styles.forgotText}>Contact admin</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword' as never)}>
                                <Text style={styles.forgotText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Login button */}
                    <View style={styles.loginBtnWrapper}>
                        <AppButton
                            title={
                                isPending || loading
                                    ? 'Signing in…'
                                    : isDriver
                                        ? 'Login as Driver'
                                        : 'Sign In'
                            }
                            onPress={handleLogin}
                            disabled={isPending || loading}
                        />
                    </View>

                    {/* Social logins (customer only) */}
                    {/* {!isDriver && (
                        <>
                            <View style={styles.dividerRow}>
                                <View style={styles.divider} />
                                <Text style={styles.dividerText}>or continue with</Text>
                                <View style={styles.divider} />
                            </View>
                            <View style={styles.socialContainer}>
                                {SOCIAL_LOGINS.map(social => (
                                    <TouchableOpacity key={social.name} style={styles.socialButton}>
                                        <Image source={{ uri: social.logo }} style={styles.socialLogo} />
                                        <Text style={styles.socialText}>{social.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )} */}

                    {/* Driver help footer inside card */}
                    {isDriver && (
                        <View style={styles.driverHelpRow}>
                            <Text style={styles.driverHelpText}>
                                Having trouble? Ask your admin to check your account in the{' '}
                                <Text style={styles.driverHelpLink}>Kalanabha Admin Panel</Text>
                            </Text>
                        </View>
                    )}
                </Animated.View>

                {/* Sign up link (customer only) */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    {!isDriver && (
                        <Text style={styles.footerText}>
                            Don't have an account?{' '}
                            <Text
                                style={styles.signUpLink}
                                onPress={() => navigation.navigate('Signup' as never)}
                            >
                                Sign Up
                            </Text>
                        </Text>
                    )}
                </Animated.View>
            </ScrollView>

            <CustomLoader visible={loading} message="Signing you in…" />
        </KeyboardAvoidingView>
    );
};

export default Login;

// ── Styles ────────────────────────g ────────────────────────────────────────────
// Computed from useAppTheme() so this screen repaints correctly in dark
// mode instead of staying pinned to the light palette baked at import.
const makeStyles = (colors: ReturnType<typeof useAppTheme>['colors'], fonts: ReturnType<typeof useAppTheme>['fonts']) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.BACKGROUND,
    },
    scroll: {
        flexGrow: 1,
        paddingBottom: H(30),
    },

    // Header
    header: {
        paddingTop: H(64),
        paddingBottom: H(44),
        alignItems: 'center',
        borderBottomLeftRadius: W(28),
        borderBottomRightRadius: W(28),
        overflow: 'hidden',
        position: 'relative',
    },
    decorCircle1: {
        position: 'absolute',
        width: W(180),
        height: W(180),
        borderRadius: W(90),
        backgroundColor: 'rgba(255,255,255,0.05)',
        top: -W(60),
        right: -W(40),
    },
    decorCircle2: {
        position: 'absolute',
        width: W(120),
        height: W(120),
        borderRadius: W(60),
        backgroundColor: 'rgba(255,255,255,0.04)',
        bottom: -W(30),
        left: -W(20),
    },
    logoBadge: {
        width: W(68),
        height: W(68),
        borderRadius: W(20),
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: H(14),
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    logoBadgeDriver: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    logoText: {
        fontSize: RF(30),
        fontFamily: fonts.BOLD_PRIMARY,
        color: '#fff',
    },
    brandName: {
        fontSize: RF(26),
        fontFamily: fonts.BOLD_PRIMARY,
        color: '#fff',
        textAlign: 'center',
        letterSpacing: 1.5,
    },
    tagline: {
        fontSize: RF(12),
        color: 'rgba(255,255,255,0.65)',
        textAlign: 'center',
        marginTop: H(4),
        letterSpacing: 0.5,
    },

    // Card
    card: {
        backgroundColor: colors.SURFACE,
        marginHorizontal: S(20),
        marginTop: H(-22),
        borderRadius: W(22),
        padding: S(24),
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
    },
    title: {
        fontSize: RF(22),
        fontFamily: fonts.BOLD_PRIMARY,
        color: colors.TEXT_PRIMARY,
        marginBottom: H(4),
    },
    subtitle: {
        fontSize: RF(12),
        color: colors.TEXT_SECONDARY,
        marginBottom: H(18),
        lineHeight: RF(18),
    },

    // Driver banner
    driverBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#EFF6FF',
        borderRadius: S(10),
        padding: S(12),
        marginBottom: H(16),
        borderLeftWidth: 3,
        borderLeftColor: colors.PRIMARY,
        gap: S(8),
    },
    driverBannerIcon: { fontSize: RF(14) },
    driverBannerText: {
        flex: 1,
        fontSize: RF(11),
        color: '#1E40AF',
        lineHeight: RF(17),
        fontFamily: fonts.PRIMARY,
    },

    // Remember / Forgot
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: H(10),
    },
    rememberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: S(20),
        height: S(20),
        borderWidth: 2,
        borderRadius: S(5),
        borderColor: '#D1D5DB',
        marginRight: S(8),
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: colors.PRIMARY,
        borderColor: colors.PRIMARY,
    },
    checkmark: {
        color: '#fff',
        fontSize: RF(12),
        fontFamily: FONTS.BOLD_PRIMARY,
    },
    rememberText: {
        color: colors.TEXT_PRIMARY,
        fontSize: RF(12),
        fontFamily: fonts.PRIMARY,
    },
    forgotText: {
        color: colors.PRIMARY,
        fontSize: RF(12),
        fontFamily: fonts.MEDIUM_PRIMARY,
    },

    // Error
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: S(6),
        backgroundColor: '#FEF2F2',
        borderRadius: S(8),
        padding: S(10),
        marginTop: H(8),
        borderLeftWidth: 3,
        borderLeftColor: '#EF4444',
    },
    errorText: {
        color: '#DC2626',
        fontSize: RF(12),
        fontFamily: fonts.PRIMARY,
    },

    // Login button
    loginBtnWrapper: { marginTop: H(18) },

    // Divider
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: H(18),
    },
    divider: { flex: 1, height: 1, backgroundColor: colors.BORDER },
    dividerText: {
        color: '#9CA3AF',
        fontSize: RF(11),
        marginHorizontal: S(10),
        fontFamily: fonts.PRIMARY,
    },

    // Social buttons
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: S(10),
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: colors.BORDER,
        borderRadius: S(12),
        paddingVertical: S(10),
        gap: S(8),
        backgroundColor: '#FAFAFA',
    },
    socialLogo: { width: S(20), height: S(20), resizeMode: 'contain' },
    socialText: {
        color: colors.TEXT_PRIMARY,
        fontSize: RF(13),
        fontFamily: fonts.MEDIUM_PRIMARY,
    },

    // Driver help footer
    driverHelpRow: {
        marginTop: H(20),
        padding: S(12),
        backgroundColor: '#FFFBEB',
        borderRadius: S(10),
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    driverHelpText: {
        fontSize: RF(11),
        color: '#92400E',
        lineHeight: RF(17),
        textAlign: 'center',
        fontFamily: fonts.PRIMARY,
    },
    driverHelpLink: {
        fontFamily: fonts.BOLD_PRIMARY,
        color: '#D97706',
    },

    // Footer
    footerText: {
        textAlign: 'center',
        color: colors.TEXT_SECONDARY,
        marginTop: H(20),
        fontSize: RF(13),
        fontFamily: fonts.PRIMARY,
    },
    signUpLink: {
        color: colors.PRIMARY,
        fontFamily: fonts.BOLD_PRIMARY,
    },
});