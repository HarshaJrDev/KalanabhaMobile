import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Animated,
    StatusBar,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';

import COLOR from '../../utils/color';
import { H, S, RF, W } from '../../utils/responsive';
import FONTS from '../../utils/fonts';

import InputField from '../../components/InputField';
import UserTypeSelector, { UserType } from '../../components/UserTypeSelector';
import AppButton from '../../components/AppButton';

import { useRegister } from '../../hooks/useRegister';
import { useAutoAddress } from '../../src/location/useAutoAddress';
import { signupSchema } from '../../validation/authSchema';
import { normalizeError } from '../../utils/error';
import { useAlert } from '../../ui/alert/useAlert';
import AlertBanner from '../../ui/alert/AlertBanner';

// Firebase
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

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
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [errors, setErrors] = useState<FormErrors>({});
    const [type, setType] = useState<UserType>('HOME');
    const [firebaseLoading, setFirebaseLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
        ]).start();
    }, []);

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
        const fieldErrors: FormErrors = {};
        result.error.issues.forEach(issue => {
            const field = issue.path[0] as keyof FormState;
            fieldErrors[field] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
    }, [form]);

    const isDisabled = useMemo(() =>
        isPending || firebaseLoading || Object.values(form).some(v => !v),
        [form, isPending, firebaseLoading]
    );

    const handleSubmit = useCallback(async () => {
        const LOG_TAG = '[SignupFlow]';

        console.log(`${LOG_TAG} START`);

        clear();

        if (!validate()) {
            console.warn(`${LOG_TAG} VALIDATION_FAILED`, { form });
            show('Please fix the highlighted fields');
            return;
        }

        try {
            setFirebaseLoading(true);

            console.log(`${LOG_TAG} FIREBASE_AUTH_START`, {
                email: form.email,
            });

            // 1️⃣ Firebase Auth
            const userCredential = await auth().createUserWithEmailAndPassword(
                form.email,
                form.password
            );

            console.log(`${LOG_TAG} FIREBASE_AUTH_SUCCESS`, {
                uid: userCredential.user.uid,
            });

            // 2️⃣ Update profile
            await userCredential.user.updateProfile({
                displayName: form.name,
            });

            console.log(`${LOG_TAG} PROFILE_UPDATED`);

            // 3️⃣ Firestore write
            const payload = {
                uid: userCredential.user.uid,
                name: form.name,
                email: form.email,
                phone: form.phone,
                address: form.address,
                type,
                createdAt: firestore.FieldValue.serverTimestamp(),
            };

            console.log(`${LOG_TAG} FIRESTORE_WRITE_START`, payload);

            await firestore()
                .collection('users')
                .doc(userCredential.user.uid)
                .set(payload);

            console.log(`${LOG_TAG} FIRESTORE_WRITE_SUCCESS`);

            show('Account created successfully!', 'success');
        } catch (firebaseError: unknown) {
            console.error(`${LOG_TAG} FIREBASE_FAILED`, firebaseError);

            // 🔥 classify error (important)
            const message = normalizeError(firebaseError);
            console.warn(`${LOG_TAG} FALLBACK_TRIGGERED`, { message });

            mutate(
                { ...form, type },
                {
                    onSuccess: () => {
                        console.log(`${LOG_TAG} BACKEND_SUCCESS`);
                        show('Account created successfully!', 'success');
                    },
                    onError: (err) => {
                        console.error(`${LOG_TAG} BACKEND_FAILED`, err);
                        show(normalizeError(err));
                    },
                }
            );
        } finally {
            console.log(`${LOG_TAG} END`);
            setFirebaseLoading(false);
        }
    }, [form, type, mutate, validate, show, clear]);

    const handleLocation = useCallback(() => {
        getAddress(address => {
            if (address) update('address', address);
            else show('Unable to fetch location');
        });
    }, [getAddress, update, show]);

    const isLoading = isPending || firebaseLoading;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.select({ ios: 'padding' })}
        >
            <StatusBar barStyle="light-content" backgroundColor={COLOR.PRIMARY} />
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <LinearGradient
                    colors={[COLOR.PRIMARY, '#1a3a6e']}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <View style={styles.headerBadge}>
                            <Text style={styles.badgeText}>K</Text>
                        </View>
                        <Text style={styles.headerTitle}>Create Account</Text>
                        <Text style={styles.headerSubtitle}>Join Kalanabha Logistics</Text>
                    </Animated.View>
                </LinearGradient>

                {/* Form Card */}
                <Animated.View
                    style={[
                        styles.card,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    <AlertBanner alert={alert} />

                    {/* Section: Personal */}
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionDot} />
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                    </View>

                    <InputField
                        label="Full Name"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={v => update('name', v)}
                        error={errors.name}
                    />
                    <InputField
                        label="Email"
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={v => update('email', v)}
                        error={errors.email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <InputField
                        label="Phone"
                        placeholder="+91 9876543210"
                        value={form.phone}
                        onChange={v => update('phone', v)}
                        error={errors.phone}
                        keyboardType="phone-pad"
                    />

                    {/* Section: Location */}
                    <View style={[styles.sectionHeader, { marginTop: H(16) }]}>
                        <View style={styles.sectionDot} />
                        <Text style={styles.sectionTitle}>Location</Text>
                    </View>

                    <InputField
                        label="Address"
                        placeholder="Enter your address"
                        value={form.address}
                        onChange={v => update('address', v)}
                        error={errors.address}
                    />
                    <Text style={styles.locationLink} onPress={handleLocation}>
                        📍 Use current location
                    </Text>

                    <UserTypeSelector value={type} onChange={setType} />

                    {/* Section: Security */}
                    <View style={[styles.sectionHeader, { marginTop: H(16) }]}>
                        <View style={styles.sectionDot} />
                        <Text style={styles.sectionTitle}>Security</Text>
                    </View>

                    <InputField
                        label="Password"
                        placeholder="Min. 8 characters"
                        secure
                        value={form.password}
                        onChange={v => update('password', v)}
                        error={errors.password}
                    />
                    <InputField
                        label="Confirm Password"
                        placeholder="Re-enter your password"
                        secure
                        value={form.confirmPassword}
                        onChange={v => update('confirmPassword', v)}
                        error={errors.confirmPassword}
                    />

                    <View style={styles.submitWrapper}>
                        <AppButton
                            title="Create Account"
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4FF',
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
        fontFamily: FONTS.BOLD_PRIMARY,
    },
    headerTitle: {
        fontSize: RF(24),
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#fff',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: RF(13),
        color: 'rgba(255,255,255,0.7)',
        marginTop: H(4),
    },
    card: {
        backgroundColor: '#fff',
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
        backgroundColor: COLOR.PRIMARY,
        marginRight: S(10),
    },
    sectionTitle: {
        fontSize: RF(14),
        fontFamily: FONTS.MEDIUM_PRIMARY,
        color: '#374151',
        letterSpacing: 0.3,
    },
    locationLink: {
        color: COLOR.PRIMARY,
        fontFamily: FONTS.MEDIUM_PRIMARY,
        fontSize: RF(13),
        marginTop: H(4),
        marginBottom: H(12),
    },
    submitWrapper: {
        marginTop: H(20),
    },
});