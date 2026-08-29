import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import {
    createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import Animated, {
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';

import COLOR from '@utils/color';
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
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: false,
                tabBarActiveTintColor: COLOR.PRIMARY,
                tabBarInactiveTintColor: '#aaa',
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

const styles = StyleSheet.create({
    tabBar: {
        height: 70,
        paddingBottom: 10,
        paddingTop: 10,
        backgroundColor: '#fff',
        borderTopWidth: 0,
        elevation: 8,
    },
});