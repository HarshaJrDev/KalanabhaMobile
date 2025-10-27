// NotificationsScreen.tsx
import React from 'react';
import { FlatList, View, SafeAreaView, StyleSheet } from 'react-native';
import NotificationCard, { NotificationType } from '../../components/NotificationCard';
import COLOR from '../../utils/color';
import { S } from '../../utils/responsive';


interface NotificationItem {
    id: string;
    title: string;
    message: string;
    date: string;
    type: NotificationType;
}

const notifications: NotificationItem[] = [
    {
        id: '1',
        title: 'Order Placed',
        message: 'Your order #1234 has been placed successfully.',
        date: '2h ago',
        type: 'info',
    },
    {
        id: '2',
        title: 'Shipped',
        message: 'Your shipment #1234 is on the way!',
        date: '1h ago',
        type: 'success',
    },
    {
        id: '3',
        title: 'Payment Failed',
        message: 'Your payment for order #5678 failed. Please retry.',
        date: '30m ago',
        type: 'warning',
    },
];

const NotificationsScreen = () => {
    const handlePress = (item: NotificationItem) => {
        // Navigate or show details
        console.log('Pressed notification:', item.id);
    };

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <NotificationCard
                        title={item.title}
                        message={item.message}
                        date={item.date}
                        type={item.type}
                        onPress={() => handlePress(item)}
                    />
                )}
                contentContainerStyle={{ paddingVertical: S(12) }}
            />
        </SafeAreaView>
    );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,

    },
});
