import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Truck, User, Box, Plus, MessageCircleIcon } from 'lucide-react-native';
import COLOR from '@utils/color';
import Home from '../../HomeScreens/Home';
import shipment from '../../HomeScreens/shipment';
import HomeScreen from './HomeScreen';
import ProfileScreen from '../ProfileScreen';
import { useTabBarStyle } from '../../navigation/useTabBarStyle';


const Tab = createBottomTabNavigator();

const AddOrdersButton = ({ children, onPress }: any) => (
    <TouchableOpacity
        style={styles.addButtonContainer}
        onPress={onPress}
        activeOpacity={0.8}
    >
        {children}
    </TouchableOpacity>
);

const DriverTabs = () => {
    // Was a hardcoded `height: 70` with no safe-area bottom inset — the
    // device's own on-screen nav bar (Android back/home/recents, or the
    // iOS home indicator) then drew on top of this custom tab bar instead
    // of sitting below it, which is also why screen content butted right
    // up against the bar with no room to breathe (the "buttons
    // overlapping the screen" bug). Shared with the customer tab
    // navigator (HomeTabs.tsx) so both stay correct together.
    const tabBarStyle = useTabBarStyle('#fff');

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: COLOR.PRIMARY,
                tabBarInactiveTintColor: '#aaa',
                tabBarStyle,
                tabBarIcon: ({ color, size }) => {
                    if (route.name === 'Home') return <Truck color={color} width={size} height={size} />;
                    if (route.name === 'Orders') return <Box color={color} width={size} height={size} />;
                    if (route.name === 'Profile') return <User color={color} width={size} height={size} />;
                    return null;
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Orders" component={shipment} />
            {/* <Tab.Screen

                name="addOrders"
                component={addOrders}
                options={{
                    tabBarLabel: '',

                    tabBarIcon: ({ color, size }) => (
                        <Plus color="#fff" width={30} height={30} style={{ top: 8 }} />
                    ),
                    tabBarButton: (props) => <AddOrdersButton {...props} />,
                }}
            /> */}
            <Tab.Screen name="Profile" component={ProfileScreen} />
            {/* <Tab.Screen name="Profile" component={Profile} /> */}
        </Tab.Navigator>
    );
};

export default DriverTabs;

const styles = StyleSheet.create({
    addButtonContainer: {
        top: -30,
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLOR.PRIMARY,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 5,
        elevation: 5,
    },
});
