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
import { useTranslation } from 'react-i18next';
import { Home as HomeIcon, User, Box, Plus, Bell, type LucideIcon } from 'lucide-react-native';

import Home from '../HomeScreens/Home';
import Shipment from '../HomeScreens/shipment';
import Profile from '../HomeScreens/Profile';
import AddOrders from '../HomeScreens/addOrders';
import NotificationScreen from '../HomeScreens/notification';
import { useUnreadNotificationCount } from '@features/notifications/hooks';
import { useMyShipments } from '@features/shipments/hooks';
import { useTabBarStyle } from './useTabBarStyle';
import FONTS from '@utils/fonts';







type HomeTabParamList = {
    HomeTab: undefined;
    Orders: undefined;
    AddOrder: undefined;
    Notification: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<HomeTabParamList>();





const TAB_ICONS: Record<string, LucideIcon> = {
    HomeTab: HomeIcon,
    Orders: Box,
    AddOrder: Plus,
    Notification: Bell,
    Profile: User,
};






const TabButton = memo(
    ({
        focused,
        Icon,
        label,
        onPress,
        activeColor,
        inactiveColor,
        dot,
        dotColor,
    }: {
        focused: boolean;
        Icon: LucideIcon;
        label: string;
        onPress: () => void;
        activeColor: string;
        inactiveColor: string;
        dot?: boolean;
        dotColor?: string;
    }) => {
        const progress = useSharedValue(focused ? 1 : 0);

        useEffect(() => {
            progress.value = withSpring(focused ? 1 : 0, { damping: 16, stiffness: 180 });
        }, [focused, progress]);

        const iconStyle = useAnimatedStyle(() => ({
            transform: [{ translateY: -progress.value * 3 }],
        }));
        const labelStyle = useAnimatedStyle(() => ({
            opacity: progress.value,
            transform: [{ translateY: (1 - progress.value) * 4 }],
        }));

        return (
            <Pressable onPress={onPress} style={styles.tabButton} hitSlop={8}>
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
            <Animated.View style={[styles.centerBtn, style, { backgroundColor: color, shadowColor: color }]}>
                <Plus size={26} color="#fff" strokeWidth={2.5} />
            </Animated.View>
        </Pressable>
    );
});






const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const barMetrics = useTabBarStyle(colors.SURFACE);

    const tabLabels: Record<string, string> = {
        HomeTab: t('tabs.home'),
        Orders: t('tabs.orders'),
        AddOrder: t('tabs.addOrder'),
        Notification: t('tabs.notifications'),
        Profile: t('tabs.profile'),
    };

    
    
    
    
    const { data: unreadCount } = useUnreadNotificationCount();
    const { data: myShipments } = useMyShipments();
    const hasUnread = (unreadCount ?? 0) > 0;
    const hasActiveShipment = (myShipments?.length ?? 0) > 0;

    return (
        <View style={[styles.barWrap, { paddingBottom: barMetrics.paddingBottom, backgroundColor: barMetrics.backgroundColor }]}>
            <View style={styles.barRow}>
                {state.routes.map((route, index) => {
                    const Icon = TAB_ICONS[route.name];
                    if (!Icon) return null;
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
                            Icon={Icon}
                            label={tabLabels[route.name]}
                            onPress={onPress}
                            activeColor={colors.PRIMARY}
                            inactiveColor={colors.GRAY}
                            dot={dot}
                            dotColor={route.name === 'Notification' ? colors.DANGER : undefined}
                        />
                    );
                })}
            </View>
        </View>
    );
};




const renderCustomTabBar = (props: BottomTabBarProps) => <CustomTabBar {...props} />;


const HomeTabs: React.FC = () => {
    return (
        <Tab.Navigator
            tabBar={renderCustomTabBar}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="HomeTab" component={Home} />
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
    tabLabel: {
        fontSize: 9.5,
        fontFamily: FONTS.BOLD_PRIMARY,
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
