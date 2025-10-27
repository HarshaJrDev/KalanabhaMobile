import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import COLOR from '../../utils/color';
import { Truck, User, Box, Plus, MessageCircleIcon } from 'lucide-react-native';
import Home from '../HomeScreens/Home';
import shipment from '../HomeScreens/shipment';
import Profile from '../HomeScreens/Profile';
import addOrders from '../HomeScreens/addOrders';
import message from '../HomeScreens/message';

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

const HomeTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: COLOR.PRIMARY,
                tabBarInactiveTintColor: '#aaa',
                tabBarStyle: styles.tabBar,
                tabBarIcon: ({ color, size }) => {
                    if (route.name === 'Home') return <Truck color={color} width={size} height={size} />;
                    if (route.name === 'Orders') return <Box color={color} width={size} height={size} />;
                    if (route.name === 'Profile') return <User color={color} width={size} height={size} />;
                    if (route.name === 'message') return <MessageCircleIcon color={color} width={size} height={size} />;
                    return null;
                },
            })}
        >
            <Tab.Screen name="Home" component={Home} />
            <Tab.Screen name="Orders" component={shipment} />
            <Tab.Screen

                name="addOrders"
                component={addOrders}
                options={{
                    tabBarLabel: '',

                    tabBarIcon: ({ color, size }) => (
                        <Plus color="#fff" width={30} height={30} style={{ top: 8 }} />
                    ),
                    tabBarButton: (props) => <AddOrdersButton {...props} />,
                }}
            />
            <Tab.Screen name="message" component={message} />
            <Tab.Screen name="Profile" component={Profile} />
        </Tab.Navigator>
    );
};

export default HomeTabs;

const styles = StyleSheet.create({
    tabBar: {
        height: 70,
        paddingBottom: 10,
        paddingTop: 10,
        elevation: 5,
        backgroundColor: '#fff',
    },
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
