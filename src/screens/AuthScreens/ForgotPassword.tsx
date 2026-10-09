














import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { H, S, RF } from '@utils/responsive';
import InputField from '@components/InputField';
import AppButton from '@components/AppButton';
import { useForgotPassword, useResetPassword } from '@hooks/useForgotPassword';
import { showToast } from '@ui/alert/toastStore';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Illustration } from '@components/Illustration';
import { Images } from '@assets/images';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ForgotPasswordScreen = () => {
    const navigation = useNavigation();
    const { colors, fonts } = useAppTheme();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => makeStyles(colors, fonts, insets), [colors, fonts, insets]);
    const { t } = useTranslation();
    const [step, setStep] = useState<'request' | 'reset'>('request');

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const forgotPasswordMutation = useForgotPassword();
    const resetPasswordMutation = useResetPassword();

    const handleRequestCode = () => {
        setError(null);
        if (!email.trim()) {
            setError(t('forgotPassword.enterEmail'));
            return;
        }
        forgotPasswordMutation.mutate(email.trim(), {
            onSuccess: () => {
                showToast(t('forgotPassword.codeSent'), 'success');
                setStep('reset');
            },
            onError: (err) => setError(err.message),
        });
    };

    const handleResetPassword = () => {
        setError(null);
        if (code.trim().length !== 6) {
            setError(t('forgotPassword.enterCode'));
            return;
        }
        if (newPassword.length < 6) {
            setError(t('forgotPassword.passwordTooShort'));
            return;
        }
        if (newPassword !== confirmPassword) {
            setError(t('forgotPassword.passwordsNoMatch'));
            return;
        }
        resetPasswordMutation.mutate(
            { email: email.trim(), code: code.trim(), newPassword },
            {
                onSuccess: () => {
                    showToast(t('forgotPassword.resetSuccess'), 'success');
                    navigation.goBack();
                },
                onError: (err) => setError(err.message),
            },
        );
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.select({ ios: 'padding' })}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={12}>
                    <ArrowLeft color={colors.TEXT_PRIMARY} size={22} />
                </TouchableOpacity>

                <Illustration
                    key={step}
                    source={
                        step === 'request'
                            ? Images.illustrations.forgotPassword
                            : Images.illustrations.otpVerification
                    }
                    size={170}
                    style={styles.illustration}
                />

                <Text style={styles.title}>
                    {step === 'request' ? t('forgotPassword.forgotPasswordTitle') : t('forgotPassword.resetPasswordTitle')}
                </Text>
                <Text style={styles.subtitle}>
                    {step === 'request'
                        ? t('forgotPassword.requestSubtitle')
                        : t('forgotPassword.resetSubtitle', { email })}
                </Text>

                {step === 'request' ? (
                    <>
                        <InputField
                            label={t('login.email')}
                            value={email}
                            onChange={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        {!!error && <Text style={styles.errorText}>{error}</Text>}
                        <View style={styles.buttonWrapper}>
                            <AppButton
                                title={forgotPasswordMutation.isPending ? t('forgotPassword.sending') : t('forgotPassword.sendResetCode')}
                                onPress={handleRequestCode}
                                loading={forgotPasswordMutation.isPending}
                                disabled={forgotPasswordMutation.isPending}
                            />
                        </View>
                    </>
                ) : (
                    <>
                        <InputField
                            label={t('forgotPassword.sixDigitCode')}
                            value={code}
                            onChange={setCode}
                            keyboardType="number-pad"
                            maxLength={6}
                        />
                        <InputField
                            label={t('forgotPassword.newPassword')}
                            value={newPassword}
                            onChange={setNewPassword}
                            secure
                        />
                        <InputField
                            label={t('forgotPassword.confirmNewPassword')}
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            secure
                        />
                        {!!error && <Text style={styles.errorText}>{error}</Text>}
                        <View style={styles.buttonWrapper}>
                            <AppButton
                                title={resetPasswordMutation.isPending ? t('forgotPassword.resetting') : t('forgotPassword.resetPasswordButton')}
                                onPress={handleResetPassword}
                                loading={resetPasswordMutation.isPending}
                                disabled={resetPasswordMutation.isPending}
                            />
                        </View>
                        <TouchableOpacity onPress={() => setStep('request')} style={styles.resendWrapper}>
                            <Text style={styles.resendText}>{t('forgotPassword.resendCode')}</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default ForgotPasswordScreen;



const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    insets: { top: number },
) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.BACKGROUND },
    scrollContent: { padding: S(24), paddingTop: insets.top + H(16), gap: H(16) },
    backButton: { marginBottom: H(16) },
    illustration: { marginBottom: H(8) },
    title: {
        fontSize: RF(24),
        fontFamily: fonts.BOLD_PRIMARY,
        color: colors.TEXT_PRIMARY,
    },
    subtitle: {
        fontSize: RF(14),
        color: colors.TEXT_SECONDARY,
        fontFamily: fonts.PRIMARY,
        marginBottom: H(8),
        lineHeight: RF(20),
    },
    errorText: {
        color: colors.DANGER,
        fontSize: RF(13),
        fontFamily: fonts.PRIMARY,
    },
    buttonWrapper: { marginTop: H(8) },
    resendWrapper: { alignItems: 'center', marginTop: H(8) },
    resendText: {
        color: colors.PRIMARY,
        fontSize: RF(13),
        fontFamily: fonts.SEMI_BOLD_PRIMARY,
    },
});
