import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Truck, User, Box } from 'lucide-react-native';
import COLOR from '@utils/color';
import TripsScreen from '../TripsScreen';
import HomeScreen from './HomeScreen';
import ProfileScreen from '../ProfileScreen';
import { useTabBarStyle } from '../../navigation/useTabBarStyle';

const Tab = createBottomTabNavigator();





const DriverTabs = () => {
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
            <Tab.Screen name="Orders" component={TripsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

export default DriverTabs;
