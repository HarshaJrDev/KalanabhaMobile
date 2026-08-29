import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import {
    ChevronRight,
    MapPin,
    CreditCard,
    Clock,
    Settings,
    Globe,
    HelpCircle,
    LogOut
} from 'lucide-react-native';
import { H, RF, W } from '../../utils/responsive';
import { useLogout, } from '../../hooks/useLogout'; // Add navigation
import { useAuthStore } from '../../features/store/authStore';
import COLOR from '../../utils/color';
import FONTS from '../../utils/fonts';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const ProfileScreen = () => {
    const logoutMutation = useLogout();
    const navigation = useNavigation();
    const user = useAuthStore((s) => s.user); // From Zustand

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

    const menuItems = [
        {
            icon: MapPin,
            label: 'Saved Address',
            value: 'Al Malaz, Riyadh 12632, SA',
            onPress: () => navigation.navigate('AddressScreen'),
        },
        { icon: CreditCard, label: 'Payment Method', onPress: () => navigation.navigate('Payment') },
        { icon: Clock, label: 'Transactions History', onPress: () => navigation.navigate('Transactions') },
        { icon: Settings, label: 'Settings', onPress: () => navigation.navigate('Settings') },
        {
            icon: Globe,
            label: 'Language',
            value: 'English (US)',
            onPress: () => navigation.navigate('Language')
        },
        { icon: HelpCircle, label: 'Help Center', onPress: () => navigation.navigate('Help') },
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

                <TouchableOpacity style={styles.profileRow} activeOpacity={0.9}>
                    {/* kalanabhaBackend's User model has no profile-photo field yet — always the placeholder */}
                    <Image
                        source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                        style={styles.avatar}
                    />
                    <View style={styles.profileInfo}>
                        <Text style={styles.name}>{user?.displayName || user?.email || 'Guest'}</Text>
                        <Text style={styles.phone}>01014384429</Text>
                    </View>
                    <LinearGradient
                        colors={['#fff', 'rgba(255,255,255,0.8)']}
                        style={styles.editButton}
                    >
                        <Text style={styles.editText}>Edit</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </LinearGradient>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statTitle}>Total Shipments</Text>
                    <Text style={styles.statValue}>102</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statTitle}>Delivered</Text>
                    <Text style={styles.statValue}>78</Text>
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
        </View>
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
});