// ProfileScreen.tsx

import React, { memo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';

/* =========================
   TYPES
========================= */

type ProfileOption = {
    id: string;
    title: string;
    icon: string;
    onPress: () => void;
};

interface ProfileData {
    name: string;
    rating: number;
    avatar: string;
    walletBalance: number;
}

/* =========================
   MOCK DATA
========================= */

const PROFILE: ProfileData = {
    name: 'Ravi Kumar',
    rating: 4.8,
    avatar: 'https://i.pravatar.cc/150?img=3',
    walletBalance: 2450,
};

/* =========================
   ACTIONS
========================= */

const useProfileActions = () => {
    const navigate = useCallback((screen: string) => {
        console.log('Navigate:', screen);
    }, []);

    return {
        goTrips: () => navigate('Trips'),
        goPayments: () => navigate('Payments'),
        goSupport: () => navigate('Support'),
        goSettings: () => navigate('Settings'),
        logout: () => console.log('Logout'),
    };
};

/* =========================
   OPTION ITEM
========================= */

const OptionItem = memo(({ item }: { item: ProfileOption }) => {
    return (
        <Pressable style={styles.option} onPress={item.onPress}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.optionText}>{item.title}</Text>
            <Text style={styles.arrow}>›</Text>
        </Pressable>
    );
});

/* =========================
   MAIN SCREEN
========================= */

const ProfileScreen = () => {
    const actions = useProfileActions();

    const options: ProfileOption[] = [
        { id: '1', title: 'Your Trips', icon: '🧾', onPress: actions.goTrips },
        { id: '2', title: 'Payments', icon: '💳', onPress: actions.goPayments },
        { id: '3', title: 'Support', icon: '🎧', onPress: actions.goSupport },
        { id: '4', title: 'Settings', icon: '⚙️', onPress: actions.goSettings },
    ];

    const renderItem = useCallback(
        ({ item }: { item: ProfileOption }) => (
            <OptionItem item={item} />
        ),
        []
    );

    return (
        <View style={styles.container}>
            <FlashList
                ListHeaderComponent={
                    <>
                        {/* PROFILE HEADER */}
                        <View style={styles.header}>
                            <Image source={{ uri: PROFILE.avatar }} style={styles.avatar} />
                            <Text style={styles.name}>{PROFILE.name}</Text>
                            <Text style={styles.rating}>⭐ {PROFILE.rating}</Text>
                        </View>

                        {/* WALLET CARD */}
                        <View style={styles.walletCard}>
                            <Text style={styles.walletLabel}>Wallet Balance</Text>
                            <Text style={styles.walletAmount}>
                                ₹{PROFILE.walletBalance}
                            </Text>
                        </View>
                    </>
                }
                data={options}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListFooterComponent={
                    <Pressable style={styles.logout} onPress={actions.logout}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </Pressable>
                }
            />
        </View>
    );
};

export default ProfileScreen
/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },

    header: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: '#FFF',
    },

    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 10,
    },

    name: {
        fontSize: 18,
        fontWeight: '700',
    },

    rating: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },

    walletCard: {
        backgroundColor: '#111',
        margin: 16,
        borderRadius: 16,
        padding: 16,
    },

    walletLabel: {
        color: '#AAA',
        fontSize: 12,
    },

    walletAmount: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '700',
        marginTop: 4,
    },

    option: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#EEE',
    },

    icon: {
        fontSize: 18,
        marginRight: 12,
    },

    optionText: {
        flex: 1,
        fontSize: 15,
    },

    arrow: {
        fontSize: 18,
        color: '#999',
    },

    logout: {
        margin: 16,
        backgroundColor: '#FF3B30',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },

    logoutText: {
        color: '#FFF',
        fontWeight: '700',
    },
});