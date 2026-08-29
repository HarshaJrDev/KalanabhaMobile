import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Linking,
} from 'react-native';
import {
    ChevronRight,
    MapPin,
    CreditCard,
    Clock,
    Settings,
    Globe,
    HelpCircle,
    LogOut,
    X,
} from 'lucide-react-native';
import { H, RF, W } from '@utils/responsive';
import { useLogout, } from '@hooks/useLogout'; // Add navigation
import { useUpdateProfile } from '@hooks/useUpdateProfile';
import { useMyShipmentHistory } from '@features/shipments/hooks';
import { useAuthStore } from '@features/store/authStore';
import COLOR from '@utils/color';
import FONTS from '@utils/fonts';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import AppTextInput from '../../components/ui/AppTextInput';
import AppButton from '../../components/ui/AppButton';
import { showToast } from '@ui/alert/toastStore';

const SUPPORT_EMAIL = 'support@kalanabha.com';

const ProfileScreen = () => {
    const logoutMutation = useLogout();
    const navigation = useNavigation();
    const user = useAuthStore((s) => s.user); // From Zustand
    const [editVisible, setEditVisible] = useState(false);

    // Real stats — GET /shipments/mine/history (every shipment this
    // customer has ever made, any status). Was hardcoded (102/78) before.
    const { data: history } = useMyShipmentHistory();
    const totalShipments = history?.length ?? 0;
    const deliveredCount = useMemo(
        () => history?.filter((s) => s.status === 'delivered').length ?? 0,
        [history],
    );

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => logoutMutation.mutate(),
                },
            ]
        );
    };

    const comingSoon = (feature: string) => showToast(`${feature} is coming soon`, 'info');

    const menuItems = [
        {
            icon: MapPin,
            label: 'Saved Address',
            // Real value (User.address via GET /users/me) — was a hardcoded
            // Riyadh address regardless of what the user actually saved.
            // There's no separate address-book screen/endpoint (one address
            // per user), so this opens the same Edit Profile modal that
            // already edits it, instead of a dead "AddressScreen" route.
            value: user?.address || 'Add address',
            onPress: () => setEditVisible(true),
        },
        { icon: CreditCard, label: 'Payment Method', onPress: () => comingSoon('Payment methods') },
        { icon: Clock, label: 'Transactions History', onPress: () => navigation.navigate('Transactions' as never) },
        { icon: Settings, label: 'Settings', onPress: () => navigation.navigate('Settings' as never) },
        {
            icon: Globe,
            label: 'Language',
            value: 'English (US)',
            onPress: () => comingSoon('Other languages'),
        },
        {
            icon: HelpCircle,
            label: 'Help Center',
            onPress: () =>
                Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() =>
                    showToast('No email app is set up on this device', 'error'),
                ),
        },
        {
            icon: LogOut,
            label: 'Log Out',
            onPress: handleLogout,
            destructive: true,
        },
    ];

    return (
        <View style={styles.root}>
            {/* Gradient Header */}
            <LinearGradient
                colors={['#1A1F6B', '#2B3FD4', COLOR.PRIMARY]}
                style={styles.header}
            >
                <Text style={styles.title}>My Profile</Text>

                <View style={styles.profileRow}>
                    {/* kalanabhaBackend's User model has no profile-photo field yet — always the placeholder */}
                    <Image
                        source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                        style={styles.avatar}
                    />
                    <View style={styles.profileInfo}>
                        <Text style={styles.name}>{user?.displayName || user?.email || 'Guest'}</Text>
                        <Text style={styles.phone}>{user?.phone || 'Add phone number'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setEditVisible(true)} activeOpacity={0.85}>
                        <LinearGradient
                            colors={['#fff', 'rgba(255,255,255,0.8)']}
                            style={styles.editButton}
                        >
                            <Text style={styles.editText}>Edit</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statTitle}>Total Shipments</Text>
                    <Text style={styles.statValue}>{totalShipments}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statTitle}>Delivered</Text>
                    <Text style={styles.statValue}>{deliveredCount}</Text>
                </View>
            </View>

            {/* Menu List */}
            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.menuItem,
                            item.destructive && styles.menuItemDestructive,
                        ]}
                        activeOpacity={0.7}
                        onPress={item.onPress}
                    >
                        <View style={styles.menuLeft}>
                            <item.icon color={item.destructive ? '#EF4444' : '#1A1F6B'} size={RF(20)} />
                            <Text style={[
                                styles.menuLabel,
                                item.destructive && styles.menuLabelDestructive,
                            ]}>
                                {item.label}
                            </Text>
                        </View>
                        <View style={styles.menuRight}>
                            {item.value && <Text style={styles.valueText}>{item.value}</Text>}
                            <ChevronRight color="#888" size={RF(18)} />
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <EditProfileModal visible={editVisible} onClose={() => setEditVisible(false)} />
        </View>
    );
};

// Screen -> useUpdateProfile -> users.api -> PATCH /users/me -> authStore + cache -> UI
const EditProfileModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    const user = useAuthStore((s) => s.user);
    const { mutate, isPending } = useUpdateProfile();

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
        }
    }, [visible, user]);

    const handleSave = () => {
        if (!displayName.trim()) {
            setError('Name is required');
            return;
        }
        setError(null);

        mutate(
            { displayName: displayName.trim(), phone: phone.trim(), address: address.trim() },
            {
                onSuccess: () => {
                    showToast('Profile updated', 'success');
                    onClose();
                },
                onError: (err) => setError(err.message),
            }
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.select({ ios: 'padding' })}
            >
                <View style={styles.modalSheet}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Profile</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={10}>
                            <X color="#64748B" size={22} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalForm}>
                        <AppTextInput label="Full Name" value={displayName} onChange={setDisplayName} />
                        <AppTextInput
                            label="Phone"
                            value={phone}
                            onChange={setPhone}
                            keyboardType="phone-pad"
                        />
                        <AppTextInput label="Address" value={address} onChange={setAddress} />
                        {!!error && <Text style={styles.modalError}>{error}</Text>}
                    </View>

                    <AppButton
                        title={isPending ? 'Saving…' : 'Save Changes'}
                        onPress={handleSave}
                        loading={isPending}
                        disabled={isPending}
                    />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        borderBottomLeftRadius: W(24),
        borderBottomRightRadius: W(24),
        paddingHorizontal: W(20),
        paddingTop: H(60),
        paddingBottom: H(24),
    },
    title: {
        color: '#fff',
        fontSize: RF(22),
        fontFamily: FONTS.SEMI_BOLD_PRIMARY,
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
    },
    profileInfo: {
        flex: 1,
    },
    name: {
        fontSize: RF(18),
        color: '#fff',
        fontFamily: FONTS.BOLD_PRIMARY,
        marginBottom: H(2),
    },
    phone: {
        fontSize: RF(14),
        color: 'rgba(255,255,255,0.8)',
        fontFamily: FONTS.PRIMARY,
    },
    editButton: {
        paddingVertical: H(10),
        paddingHorizontal: W(20),
        borderRadius: W(12),
        alignItems: 'center',
    },
    editText: {
        color: '#1A1F6B',
        fontSize: RF(14),
        fontFamily: FONTS.SEMI_BOLD_PRIMARY,
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
        backgroundColor: '#fff',
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
        color: '#64748B',
        fontSize: RF(13),
        fontFamily: FONTS.PRIMARY,
        marginBottom: H(4),
    },
    statValue: {
        fontSize: RF(24),
        fontWeight: '800',
        color: '#1A1F6B',
        fontFamily: FONTS.BOLD_PRIMARY,
    },
    menuScroll: {
        flex: 1,
        paddingHorizontal: W(20),
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: W(16),
        paddingVertical: H(18),
        paddingHorizontal: W(20),
        marginBottom: H(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    menuItemDestructive: {
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
        backgroundColor: '#fef2f2',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: W(14),
    },
    menuLabel: {
        fontSize: RF(16),
        color: '#1A1F6B',
        fontFamily: FONTS.SEMI_BOLD_PRIMARY,
    },
    menuLabelDestructive: {
        color: '#EF4444',
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: W(8),
    },
    valueText: {
        color: '#64748B',
        fontSize: RF(14),
        fontFamily: FONTS.PRIMARY,
    },

    // Edit Profile modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: W(24),
        borderTopRightRadius: W(24),
        padding: W(20),
        paddingBottom: H(32),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: H(16),
    },
    modalTitle: {
        fontSize: RF(18),
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#1A1F6B',
    },
    modalForm: {
        gap: H(14),
        marginBottom: H(20),
    },
    modalError: {
        color: '#EF4444',
        fontSize: RF(13),
        fontFamily: FONTS.PRIMARY,
    },
});