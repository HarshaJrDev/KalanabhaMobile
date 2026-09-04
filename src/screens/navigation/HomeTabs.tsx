import React, { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
    createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Animated, {
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';

import { useAppTheme } from '@theme/ThemeContext';
import { Truck, User, Box, Plus } from 'lucide-react-native';

import Home from '../HomeScreens/Home';
import Shipment from '../HomeScreens/shipment';
import Profile from '../HomeScreens/Profile';
import AddOrders from '../HomeScreens/addOrders';
import { RootStackParamList } from './types';



const Tab = createBottomTabNavigator<RootStackParamList>();

/* ----------------------------- ICON CONFIG ----------------------------- */

const ICONS = {
    Home: Truck,
    Orders: Box,
    AddOrder: Plus,
    Profile: User,
} as const;

type TabName = keyof typeof ICONS;

/* ----------------------------- ANIMATED ICON ----------------------------- */

const TabIcon = memo(
    ({
        focused,
        color,
        size,
        Icon,
    }: {
        focused: boolean;
        color: string;
        size: number;
        Icon: React.ComponentType<any>;
    }) => {
        const animatedStyle = useAnimatedStyle(() => ({
            transform: [
                { scale: withSpring(focused ? 1.15 : 1) },
                { translateY: withSpring(focused ? -4 : 0) },
            ],
        }));

        return (
            <Animated.View style={animatedStyle}>
                <Icon color={color} width={size} height={size} />
            </Animated.View>
        );
    }
);

/* ----------------------------- MAIN NAV ----------------------------- */

const HomeTabs: React.FC = () => {
    const { colors } = useAppTheme();
    // The device's own on-screen nav bar (Android's back/home/recents, or
    // the iOS home indicator) sits in this inset — without adding it to the
    // tab bar's height/padding, that system chrome visually overlaps this
    // custom tab bar instead of sitting below it (the "3 buttons
    // overlapping" bug: the OS nav buttons were drawn on top of our own
    // icons because the bar was a fixed 70px with no room reserved for
    // them).
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => makeStyles(colors, insets.bottom), [colors, insets.bottom]);

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: false,
                tabBarActiveTintColor: colors.PRIMARY,
                tabBarInactiveTintColor: colors.GRAY,
                tabBarStyle: styles.tabBar,

                tabBarIcon: ({ color, size, focused }) => {
                    const Icon = ICONS[route.name as TabName];

                    if (!Icon) return null;

                    return (
                        <TabIcon
                            focused={focused}
                            color={color}
                            size={size}
                            Icon={Icon}
                        />
                    );
                },
            })}
        >
            <Tab.Screen name="Home" component={Home} />
            <Tab.Screen name="Orders" component={Shipment} />
            <Tab.Screen name="AddOrder" component={AddOrders} />
            <Tab.Screen name="Profile" component={Profile} />
        </Tab.Navigator>
    );
};

export default HomeTabs;

/* ----------------------------- STYLES ----------------------------- */

const makeStyles = (colors: ReturnType<typeof useAppTheme>['colors'], bottomInset: number) => StyleSheet.create({
    tabBar: {
        height: 60 + bottomInset,
        paddingBottom: Math.max(bottomInset, 10),
        paddingTop: 10,
        backgroundColor: colors.SURFACE,
        borderTopWidth: 0,
        elevation: 8,
    },
});
