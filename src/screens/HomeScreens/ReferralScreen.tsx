






import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Share, ActivityIndicator } from 'react-native';
import { ScreenHeader } from '@components/ScreenHeader';
import { Gift, Share2 } from 'lucide-react-native';
import { useReferralCode } from '@hooks/useReferralCode';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import FONTS from '@utils/fonts';

const ReferralScreen = () => {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    const { data, isLoading } = useReferralCode();
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const handleShare = () => {
        if (!data?.referralCode) return;
        Share.share({
            message: t('referral.shareMessage', { code: data.referralCode }),
        });
    };

    return (
        <View style={styles.container}>
            <ScreenHeader title={t('referral.title')} />

            <View style={styles.content}>
                <View style={styles.iconWrap}>
                    <Gift color={colors.PRIMARY} size={40} />
                </View>
                <Text style={styles.heading}>{t('referral.heading')}</Text>
                <Text style={styles.subheading}>{t('referral.subheading')}</Text>

                <View style={styles.codeCard}>
                    {isLoading || !data ? (
                        <ActivityIndicator color={colors.PRIMARY} />
                    ) : (
                        <Text style={styles.code}>{data.referralCode}</Text>
                    )}
                </View>

                <Pressable style={styles.shareBtn} onPress={handleShare} disabled={!data}>
                    <Share2 color="#fff" size={18} />
                    <Text style={styles.shareBtnText}>{t('referral.shareButton')}</Text>
                </Pressable>

                <Text style={styles.footnote}>{t('referral.footnote')}</Text>
            </View>
        </View>
    );
};

export default ReferralScreen;

const makeStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.BACKGROUND },
    content: { flex: 1, alignItems: 'center', padding: 24, paddingTop: 40 },
    iconWrap: {
        width: 88, height: 88, borderRadius: 44, backgroundColor: colors.PRIMARY_LIGHT,
        alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    heading: { fontSize: 20, fontFamily: FONTS.BOLD_PRIMARY, color: colors.TEXT_PRIMARY, textAlign: 'center' },
    subheading: { fontSize: 14, color: colors.GRAY, textAlign: 'center', marginTop: 8, marginBottom: 28, lineHeight: 20 },
    codeCard: {
        width: '100%', borderWidth: 2, borderColor: colors.PRIMARY, borderStyle: 'dashed',
        borderRadius: 16, paddingVertical: 24, alignItems: 'center', marginBottom: 24,
        backgroundColor: colors.SURFACE,
    },
    code: { fontSize: 28, fontFamily: FONTS.BOLD_PRIMARY, color: colors.PRIMARY, letterSpacing: 4 },
    shareBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: colors.PRIMARY, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32,
    },
    shareBtnText: { color: '#fff', fontSize: 15, fontFamily: FONTS.BOLD_PRIMARY },
    footnote: { fontSize: 12, color: colors.GRAY, textAlign: 'center', marginTop: 20, lineHeight: 18 },
});
