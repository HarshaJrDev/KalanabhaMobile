import React, { memo, useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import {
    createBottomTabNavigator,
    type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';

import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { useAppTheme } from '@theme/ThemeContext';
import { Home as HomeIcon, User, Box, Plus, Bell, type LucideIcon } from 'lucide-react-native';

import Home from '../HomeScreens/Home';
import Shipment from '../HomeScreens/shipment';
import Profile from '../HomeScreens/Profile';
import AddOrders from '../HomeScreens/addOrders';
import NotificationScreen from '../HomeScreens/notification';
import { useUnreadNotificationCount } from '@features/notifications/hooks';
import { useMyShipments } from '@features/shipments/hooks';
import { RootStackParamList } from './types';
import { useTabBarStyle } from './useTabBarStyle';

const Tab = createBottomTabNavigator<RootStackParamList>();

/* ----------------------------- TAB CONFIG ----------------------------- */
// "AddOrder" gets special center-FAB treatment below rather than sitting
// in the row like the other four — it's the app's one primary action
// (start a booking), so it's visually raised instead of competing with
// Home/Orders/Notification/Profile for the same tab-button styling.
const TAB_META: Record<string, { icon: LucideIcon; label: string }> = {
    Home: { icon: HomeIcon, label: 'Home' },
    Orders: { icon: Box, label: 'Orders' },
    AddOrder: { icon: Plus, label: 'Book' },
    Notification: { icon: Bell, label: 'Notifications' },
    Profile: { icon: User, label: 'Profile' },
};

/* ----------------------------- TAB BUTTON ----------------------------- */
// Icon + label share one focus progress value: the label fades/widens in
// and the icon lifts slightly, all driven by one spring rather than a
// plain scale/translateY-only animation — reads as one cohesive
// transition instead of an icon twitch. `dot` is a real signal (unread
// notifications, an active shipment) — never shown without one.
const TabButton = memo(
    ({
        focused,
        Icon,
        label,
        onPress,
        activeColor,
        inactiveColor,
        pillColor,
        dot,
        dotColor,
    }: {
        focused: boolean;
        Icon: LucideIcon;
        label: string;
        onPress: () => void;
        activeColor: string;
        inactiveColor: string;
        pillColor: string;
        dot?: boolean;
        dotColor?: string;
    }) => {
        const progress = useSharedValue(focused ? 1 : 0);

        useEffect(() => {
            progress.value = withSpring(focused ? 1 : 0, { damping: 16, stiffness: 180 });
        }, [focused, progress]);

        const pillStyle = useAnimatedStyle(() => ({
            opacity: progress.value,
            transform: [{ scale: 0.7 + progress.value * 0.3 }],
        }));
        const iconStyle = useAnimatedStyle(() => ({
            transform: [{ translateY: -progress.value * 3 }],
        }));
        const labelStyle = useAnimatedStyle(() => ({
            opacity: progress.value,
            transform: [{ translateY: (1 - progress.value) * 4 }],
        }));

        return (
            <Pressable onPress={onPress} style={styles.tabButton} hitSlop={8}>
                <Animated.View style={[styles.pill, pillStyle, { backgroundColor: pillColor }]} />
                <View>
                    <Animated.View style={iconStyle}>
                        <Icon size={21} color={focused ? activeColor : inactiveColor} strokeWidth={focused ? 2.4 : 2} />
                    </Animated.View>
                    {dot && <View style={[styles.iconBadge, { backgroundColor: dotColor ?? activeColor }]} />}
                </View>
                <Animated.Text style={[styles.tabLabel, labelStyle, { color: activeColor }]} numberOfLines={1}>
                    {label}
                </Animated.Text>
                {dot && focused && <View style={[styles.underDot, { backgroundColor: dotColor ?? activeColor }]} />}
            </Pressable>
        );
    },
);

/* ----------------------------- CENTER FAB ----------------------------- */
// Raised above the bar with a soft glow halo behind it, not squeezed
// into the same row height as the other four — the one action every
// customer needs fastest (book a delivery) gets the most visually
// prominent spot instead of being just another icon in the row.
const CenterButton = memo(({ onPress, color }: { onPress: () => void; color: string }) => {
    const press = useSharedValue(1);
    const style = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

    return (
        <Pressable
            onPress={onPress}
            onPressIn={() => { press.value = withSpring(0.9, { damping: 14, stiffness: 240 }); }}
            onPressOut={() => { press.value = withSpring(1, { damping: 14, stiffness: 240 }); }}
            style={styles.centerSlot}
            hitSlop={10}
        >
            <View style={[styles.centerGlow, { backgroundColor: color }]} />
            <Animated.View style={[styles.centerBtn, style, { backgroundColor: color, shadowColor: color }]}>
                <Plus size={26} color="#fff" strokeWidth={2.5} />
            </Animated.View>
        </Pressable>
    );
});

/* ----------------------------- CUSTOM BAR ----------------------------- */
// A fully custom tabBar (not the default renderer) so the bar can be a
// floating rounded pill with a raised center action — while still
// reusing useTabBarStyle's exact height/inset math, so screens' existing
// useTabBarContentPadding() reservation stays correct and doesn't drift
// out of sync the way the driver tab bar once did.
const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
    const { colors } = useAppTheme();
    const barMetrics = useTabBarStyle(colors.SURFACE);

    // Real signals only: an unread-notification count already backs the
    // Home header's bell badge, and "has an active shipment right now"
    // already backs Home's hero card — reused here, not invented for
    // this bar.
    const { data: unreadCount } = useUnreadNotificationCount();
    const { data: myShipments } = useMyShipments();
    const hasUnread = (unreadCount ?? 0) > 0;
    const hasActiveShipment = (myShipments?.length ?? 0) > 0;

    return (
        <View style={[styles.barWrap, { paddingBottom: barMetrics.paddingBottom, backgroundColor: barMetrics.backgroundColor }]}>
            <View style={styles.barRow}>
                {state.routes.map((route, index) => {
                    const meta = TAB_META[route.name];
                    if (!meta) return null;
                    const focused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                        if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                    };

                    if (route.name === 'AddOrder') {
                        return <CenterButton key={route.key} onPress={onPress} color={colors.PRIMARY} />;
                    }

                    const dot = route.name === 'Notification' ? hasUnread : route.name === 'Orders' ? hasActiveShipment : false;

                    return (
                        <TabButton
                            key={route.key}
                            focused={focused}
                            Icon={meta.icon}
                            label={meta.label}
                            onPress={onPress}
                            activeColor={colors.PRIMARY}
                            inactiveColor={colors.GRAY}
                            pillColor={colors.PRIMARY_LIGHT}
                            dot={dot}
                            dotColor={route.name === 'Notification' ? colors.DANGER : undefined}
                        />
                    );
                })}
            </View>
        </View>
    );
};

// A stable module-level function reference — an inline arrow here would
// be redefined every render, forcing React Navigation to remount the
// entire tab bar subtree instead of just updating it.
const renderCustomTabBar = (props: BottomTabBarProps) => <CustomTabBar {...props} />;

/* ----------------------------- MAIN NAV ----------------------------- */

const HomeTabs: React.FC = () => {
    return (
        <Tab.Navigator
            tabBar={renderCustomTabBar}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Home" component={Home} />
            <Tab.Screen name="Orders" component={Shipment} />
            <Tab.Screen name="AddOrder" component={AddOrders} />
            <Tab.Screen name="Notification" component={NotificationScreen} />
            <Tab.Screen name="Profile" component={Profile} />
        </Tab.Navigator>
    );
};

export default HomeTabs;

const styles = StyleSheet.create({
    barWrap: {
        borderTopWidth: 0,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        paddingTop: 8,
        height: 52,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        height: 48,
    },
    pill: {
        position: 'absolute',
        top: 0,
        width: 52,
        height: 40,
        borderRadius: 16,
    },
    tabLabel: {
        fontSize: 9.5,
        fontWeight: '700',
    },
    iconBadge: {
        position: 'absolute',
        top: -2,
        right: -6,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    underDot: {
        position: 'absolute',
        bottom: -6,
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    centerSlot: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    // A soft, low-opacity halo behind the FAB — the "glow" seen in the
    // reference mockup — sitting under the button itself in z-order.
    centerGlow: {
        position: 'absolute',
        top: -34,
        width: 90,
        height: 90,
        borderRadius: 45,
        opacity: 0.18,
    },
    centerBtn: {
        width: 54,
        height: 54,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -26,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 10,
    },
});
