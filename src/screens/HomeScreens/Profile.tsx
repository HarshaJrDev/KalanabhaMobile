import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronRight,
    Bookmark,
    Gift,
    Clock,
    Settings,
    Globe,
    HelpCircle,
    LogOut,
    X,
} from 'lucide-react-native';
import { H, RF, W } from '@utils/responsive';
import { useLogout, } from '@hooks/useLogout'; 
import { useUpdateProfile } from '@hooks/useUpdateProfile';
import { useMyShipmentHistory } from '@features/shipments/hooks';
import { useAuthStore } from '@features/store/authStore';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTabBarContentPadding } from '../navigation/useTabBarStyle';
import AppTextInput from '../../components/ui/AppTextInput';
import AppButton from '../../components/ui/AppButton';
import { AppBottomSheet, type AppBottomSheetRef } from '../../components/ui/AppBottomSheet';
import { showToast } from '@ui/alert/toastStore';
import { confirmDialog } from '@ui/alert/confirmStore';
import { useAppTheme } from '@theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { LanguagePickerModal } from '@components/LanguagePickerModal';
import { LANGUAGE_LABELS, type SupportedLanguage } from '../../i18n';






const initialsFor = (label: string) =>
    label.trim().split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';

const ProfileScreen = () => {
    const { colors, fonts } = useAppTheme();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => makeStyles(colors, fonts, insets), [colors, fonts, insets]);
    const { t, i18n } = useTranslation();
    const logoutMutation = useLogout();
    const navigation = useNavigation();
    const user = useAuthStore((s) => s.user); // From Zustand
    const [editVisible, setEditVisible] = useState(false);
    const [langVisible, setLangVisible] = useState(false);
    // This screen lives under the bottom tab bar (HomeTabs.tsx "Profile")
    // — the menu ScrollView had no bottom padding at all, so the last
    // menu item (Logout) sat right behind the bar.
    const tabBarPadding = useTabBarContentPadding();

    const entrance = useSharedValue(0);
    useEffect(() => {
        entrance.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    }, [entrance]);
    const entranceStyle = useAnimatedStyle(() => ({
        opacity: entrance.value,
        transform: [{ translateY: (1 - entrance.value) * 14 }],
    }));

    // Real stats — GET /shipments/mine/history (every shipment this
    // customer has ever made, any status). Was hardcoded (102/78) before.
    const { data: history } = useMyShipmentHistory();
    const totalShipments = history?.length ?? 0;
    const deliveredCount = useMemo(
        () => history?.filter((s) => s.status === 'delivered').length ?? 0,
        [history],
    );

    const handleLogout = async () => {
        const confirmed = await confirmDialog({
            title: t('profile.logoutTitle'),
            message: t('profile.logoutMessage'),
            confirmText: t('common.logout'),
            destructive: true,
        });
        if (confirmed) logoutMutation.mutate();
    };

    
    
    
    
    
    
    
    
    
    const sections = [
        {
            label: t('profile.sectionAccount'),
            items: [
                { icon: Bookmark, label: t('profile.savedAddresses'), onPress: () => navigation.navigate('SavedAddresses' as never) },
                { icon: Clock, label: t('profile.transactionsHistory'), onPress: () => navigation.navigate('Transactions' as never) },
                { icon: Gift, label: t('profile.referAndEarn'), onPress: () => navigation.navigate('Referral' as never) },
            ],
        },
        {
            label: t('profile.sectionPreferences'),
            items: [
                {
                    icon: Globe,
                    label: t('profile.language'),
                    value: LANGUAGE_LABELS[i18n.language as SupportedLanguage] ?? LANGUAGE_LABELS.en,
                    onPress: () => setLangVisible(true),
                },
                { icon: Settings, label: t('profile.settings'), onPress: () => navigation.navigate('Settings' as never) },
            ],
        },
        {
            label: t('profile.sectionSupport'),
            items: [
                { icon: HelpCircle, label: t('profile.helpCenter'), onPress: () => navigation.navigate('SupportTickets' as never) },
            ],
        },
    ];

    return (
        <View style={styles.root}>
            <LinearGradient
                colors={[colors.PRIMARY_DARK, colors.PRIMARY]}
                style={styles.header}
            >
                <Animated.View style={entranceStyle}>
                    <Text style={styles.title}>{t('profile.title')}</Text>

                    <View style={styles.profileRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{initialsFor(user?.displayName || user?.email || '?')}</Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.name} numberOfLines={1}>{user?.displayName || user?.email || 'Guest'}</Text>
                            <Text style={styles.phone}>{user?.phone || t('profile.addPhonePlaceholder')}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setEditVisible(true)} activeOpacity={0.85}>
                            <LinearGradient
                                colors={['#fff', 'rgba(255,255,255,0.8)']}
                                style={styles.editButton}
                            >
                                <Text style={styles.editText}>{t('common.edit')}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </LinearGradient>

            <Animated.View style={[styles.statsContainer, entranceStyle]}>
                <TouchableOpacity
                    style={styles.statCard}
                    activeOpacity={0.75}
                    onPress={() => (navigation as any).navigate('ShipmentHistory', { initialStatus: 'all' })}
                >
                    <Text style={styles.statTitle}>{t('profile.totalShipments')}</Text>
                    <Text style={styles.statValue}>{totalShipments}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.statCard}
                    activeOpacity={0.75}
                    onPress={() => (navigation as any).navigate('ShipmentHistory', { initialStatus: 'delivered' })}
                >
                    <Text style={styles.statTitle}>{t('profile.delivered')}</Text>
                    <Text style={styles.statValue}>{deliveredCount}</Text>
                </TouchableOpacity>
            </Animated.View>

            <ScrollView
                style={styles.menuScroll}
                contentContainerStyle={{ paddingBottom: tabBarPadding }}
                showsVerticalScrollIndicator={false}
            >
                {sections.map((section) => (
                    <View key={section.label} style={styles.sectionBlock}>
                        <Text style={styles.sectionLabel}>{section.label}</Text>
                        <View style={styles.sectionCard}>
                            {section.items.map((item, index) => (
                                <TouchableOpacity
                                    key={item.label}
                                    style={[
                                        styles.menuItem,
                                        index === section.items.length - 1 && styles.menuItemLast,
                                    ]}
                                    activeOpacity={0.7}
                                    onPress={item.onPress}
                                >
                                    <View style={styles.menuLeft}>
                                        <View style={[styles.menuIconWrap, { backgroundColor: colors.PRIMARY_LIGHT }]}>
                                            <item.icon color={colors.PRIMARY} size={RF(18)} />
                                        </View>
                                        <Text style={styles.menuLabel}>{item.label}</Text>
                                    </View>
                                    <View style={styles.menuRight}>
                                        {'value' in item && item.value && (
                                            <Text style={styles.valueText}>{item.value}</Text>
                                        )}
                                        <ChevronRight color={colors.GRAY} size={RF(18)} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                <TouchableOpacity
                    style={styles.logoutRow}
                    activeOpacity={0.7}
                    onPress={handleLogout}
                >
                    <LogOut color={colors.ERROR} size={RF(18)} />
                    <Text style={styles.logoutLabel}>{t('common.logout')}</Text>
                </TouchableOpacity>
            </ScrollView>

            <EditProfileModal visible={editVisible} onClose={() => setEditVisible(false)} />
            <LanguagePickerModal visible={langVisible} onClose={() => setLangVisible(false)} />
        </View>
    );
};


const EditProfileModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    const { colors, fonts } = useAppTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => makeStyles(colors, fonts), [colors, fonts]);
    const user = useAuthStore((s) => s.user);
    const { mutate, isPending } = useUpdateProfile();
    const sheetRef = React.useRef<AppBottomSheetRef>(null);

    const [displayName, setDisplayName] = useState(user?.displayName ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [address, setAddress] = useState(user?.address ?? '');
    const [error, setError] = useState<string | null>(null);

    // Reset the form to the latest saved values each time the modal opens,
    // so a cancelled edit never leaves stale text behind for next time.
    React.useEffect(() => {
        if (visible) {
            setDisplayName(user?.displayName ?? '');
            setPhone(user?.phone ?? '');
            setAddress(user?.address ?? '');
            setError(null);
            sheetRef.current?.present();
        } else {
            sheetRef.current?.dismiss();
        }
    }, [visible, user]);

    const handleSave = () => {
        if (!displayName.trim()) {
            setError(t('editProfile.nameRequired'));
            return;
        }
        setError(null);

        mutate(
            { displayName: displayName.trim(), phone: phone.trim(), address: address.trim() },
            {
                onSuccess: () => {
                    showToast(t('editProfile.profileUpdated'), 'success');
                    onClose();
                },
                onError: (err) => setError(err.message),
            }
        );
    };

    return (
        <AppBottomSheet ref={sheetRef} onDismiss={onClose}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('editProfile.editProfileTitle')}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={10}>
                    <X color={colors.TEXT_SECONDARY} size={22} />
                </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
                <AppTextInput label={t('editProfile.fullName')} value={displayName} onChange={setDisplayName} />
                <AppTextInput
                    label={t('editProfile.phone')}
                    value={phone}
                    onChange={setPhone}
                    keyboardType="phone-pad"
                />
                <AppTextInput label={t('editProfile.address')} value={address} onChange={setAddress} />
                {!!error && <Text style={styles.modalError}>{error}</Text>}
            </View>

            <AppButton
                title={isPending ? t('editProfile.savingChanges') : t('editProfile.saveChanges')}
                onPress={handleSave}
                loading={isPending}
                disabled={isPending}
            />
        </AppBottomSheet>
    );
};

export default ProfileScreen;



const makeStyles = (
    colors: ReturnType<typeof useAppTheme>['colors'],
    fonts: ReturnType<typeof useAppTheme>['fonts'],
    insets: { top: number } = { top: 0 },
) => StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.BACKGROUND,
    },
    header: {
        borderBottomLeftRadius: W(24),
        borderBottomRightRadius: W(24),
        paddingHorizontal: W(20),
        paddingTop: insets.top + H(16),
        paddingBottom: H(24),
    },
    title: {
        color: '#fff',
        fontSize: RF(22),
        fontFamily: fonts.SEMI_BOLD_PRIMARY,
        marginBottom: H(20),
        textAlign: 'center',
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: W(70),
        height: W(70),
        borderRadius: W(35),
        marginRight: W(16),
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(255,255,255,0.22)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: RF(24),
        fontFamily: fonts.BOLD_PRIMARY,
    },
    profileInfo: {
        flex: 1,
    },
    name: {
        fontSize: RF(18),
        color: '#fff',
        fontFamily: fonts.BOLD_PRIMARY,
        marginBottom: H(2),
    },
    phone: {
        fontSize: RF(14),
        color: 'rgba(255,255,255,0.8)',
        fontFamily: fonts.PRIMARY,
    },
    editButton: {
        paddingVertical: H(10),
        paddingHorizontal: W(20),
        borderRadius: W(12),
        alignItems: 'center',
    },
    editText: {
        color: colors.TEXT_PRIMARY,
        fontSize: RF(14),
        fontFamily: fonts.SEMI_BOLD_PRIMARY,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: W(20),
        marginTop: H(20),
        marginBottom: H(16),
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.SURFACE,
        marginHorizontal: W(8),
        borderRadius: W(16),
        paddingVertical: H(20),
        paddingHorizontal: W(16),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    statTitle: {
        color: colors.TEXT_SECONDARY,
        fontSize: RF(13),
        fontFamily: fonts.PRIMARY,
        marginBottom: H(4),
    },
    statValue: {
        fontSize: RF(24),
        fontFamily: fonts.BOLD_PRIMARY,
        color: colors.TEXT_PRIMARY,
    },
    menuScroll: {
        flex: 1,
        paddingHorizontal: W(20),
    },
    sectionBlock: {
        marginBottom: H(20),
    },
    sectionLabel: {
        fontSize: RF(12),
        fontFamily: fonts.SEMI_BOLD_PRIMARY,
        color: colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginBottom: H(8),
        marginLeft: W(4),
    },
    sectionCard: {
        backgroundColor: colors.SURFACE,
        borderRadius: W(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: H(16),
        paddingHorizontal: W(16),
        borderBottomWidth: 1,
        borderBottomColor: colors.BORDER,
    },
    menuItemLast: {
        borderBottomWidth: 0,
    },
    logoutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: W(8),
        paddingVertical: H(16),
        marginBottom: H(8),
    },
    logoutLabel: {
        fontSize: RF(15),
        fontFamily: fonts.SEMI_BOLD_PRIMARY,
        color: colors.ERROR,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: W(14),
    },
    menuIconWrap: {
        width: W(36),
        height: W(36),
        borderRadius: W(11),
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: {
        fontSize: RF(16),
        color: colors.TEXT_PRIMARY,
        fontFamily: fonts.SEMI_BOLD_PRIMARY,
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: W(8),
    },
    valueText: {
        color: colors.TEXT_SECONDARY,
        fontSize: RF(14),
        fontFamily: fonts.PRIMARY,
    },

    
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: H(16),
    },
    modalTitle: {
        fontSize: RF(18),
        fontFamily: fonts.BOLD_PRIMARY,
        color: colors.TEXT_PRIMARY,
    },
    modalForm: {
        gap: H(14),
        marginBottom: H(20),
    },
    modalError: {
        color: colors.ERROR,
        fontSize: RF(13),
        fontFamily: fonts.PRIMARY,
    },
});