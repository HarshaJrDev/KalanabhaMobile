
import React, { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/api/queryClient';
import { initNetworkMonitoring } from './src/api/network';
import { GlobalToast } from '@ui/alert/GlobalToast';
import { GlobalDeliveryOtpModal } from '@ui/alert/GlobalDeliveryOtpModal';
import { registerFCMToken, setupFCMListeners } from '@utils/cm';
import { navigationRef, flushPendingNotificationTarget, handleNotificationTap } from '@features/notifications/deepLink';
import { ThemeProvider, useAppTheme } from '@theme/ThemeContext';
import Splash from '@screens/AuthScreens/Splash';
import OnBoarding from '@screens/AuthScreens/onBoarding';
import Login from '@screens/AuthScreens/Login';
import Signup from '@screens/AuthScreens/Signup';
import ForgotPassword from '@screens/AuthScreens/ForgotPassword';
import SelectAccount from '@screens/AuthScreens/SelectAccount';
import HomeTabs from '@screens/navigation/HomeTabs';
import DriverTabs from '@screens/Driver/HomeScreen/HomeScreenDrive';
import DriverSettingsScreen from '@screens/Driver/SettingsScreen';
import DriverTripsScreen from '@screens/Driver/TripsScreen';
import FuelStationsScreen from '@screens/Driver/FuelStationsScreen';
import DriverDocumentsScreen from '@screens/Driver/DriverDocumentsScreen';
import RatingScreen from '@screens/HomeScreens/RatingScreen';
import CustomerSettingsScreen from '@screens/HomeScreens/SettingsScreen';
import TransactionsScreen from '@screens/HomeScreens/TransactionsScreen';
import SupportTicketsScreen from '@screens/HomeScreens/SupportTicketsScreen';
import NewTicketScreen from '@screens/HomeScreens/NewTicketScreen';
import TicketDetailScreen from '@screens/HomeScreens/TicketDetailScreen';
import notification from '@screens/HomeScreens/notification';
import SearchScreen from '@screens/Search/SearchScreen';
import CheckRate from '@screens/HomeScreens/CheckRate';
import ShipmentDetailsScreen from '@screens/HomeScreens/ShipmentDetailsScreen/ShipmentDetailsScreen';
import ShipmentChatScreen from '@screens/HomeScreens/ShipmentChatScreen';
import InboxScreen from '@screens/HomeScreens/InboxScreen';
import QRScanScreen from '@screens/Search/QRScanScreen';
import ProfileScreen from '@screens/HomeScreens/Profile';
import Sender from '@screens/addOrder/sender';
import NewOrder from '@screens/HomeScreens/addOrders';
import ShipmentScreen from '@screens/HomeScreens/shipment';
import { useAuthState } from '@hooks/useAuthState';
import { useAuthStore } from '@features/store/authStore';

const Stack = createNativeStackNavigator();

const App = () => {
  const { isAuthenticated } = useAuthState();
  const role = useAuthStore((s) => s.user?.role);
  const showAppFlow = isAuthenticated && !!role;
  const resolvingSession = isAuthenticated && !role;
  useEffect(() => {
    const unsubscribe = initNetworkMonitoring();
    return unsubscribe;
  }, []);
  useEffect(() => {
    if (!showAppFlow) return;
    registerFCMToken(role === 'DRIVER' ? 'driver' : 'customer');
    flushPendingNotificationTarget();
    const unsub = setupFCMListeners((title, body, data) => {
      const shipmentId = (data?.shipmentId as string) ?? null;
      const type = (data?.type as string) ?? null;
      Alert.alert(title, body, [
        {
          text: 'View',
          onPress: () => handleNotificationTap(type, shipmentId),
        },
        { text: 'Dismiss' },
      ]);
    });
    return unsub;
  }, [showAppFlow, role]);

  if (resolvingSession) {
    return (
      <ThemeProvider>
        <LoadingGate />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GlobalToast />
        <GlobalDeliveryOtpModal />
        <NavigationContainer ref={navigationRef} onReady={flushPendingNotificationTarget}>
          <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={showAppFlow && role === 'DRIVER' ? 'DriverTabs' : undefined}
          >

            {!showAppFlow ? (
              <>
                <Stack.Screen name="Splash" component={Splash} />
                <Stack.Screen name="OnBoarding" component={OnBoarding} />
                <Stack.Screen name="SelectAccount" component={SelectAccount} />
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="Signup" component={Signup} />
                <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
              </>
            ) : (
              <>
                <Stack.Screen name="Home" component={HomeTabs} />
                <Stack.Screen name="DriverTabs" component={DriverTabs} />
                <Stack.Screen name="Notification" component={notification} />
                <Stack.Screen name="Search" component={SearchScreen} />
                <Stack.Screen name="CheckRate" component={CheckRate} />
                <Stack.Screen name="ShipmentDetailsScreen" component={ShipmentDetailsScreen} />
                <Stack.Screen name="ShipmentChat" component={ShipmentChatScreen} />
                <Stack.Screen name="Inbox" component={InboxScreen} />
                <Stack.Screen name="QRScan" component={QRScanScreen} />
                <Stack.Screen name="shipment" component={ShipmentScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="addOrder" component={NewOrder} />
                <Stack.Screen name="Sender" component={Sender} />
                <Stack.Screen name="DriverSettings" component={DriverSettingsScreen} />
                <Stack.Screen name="DriverTrips" component={DriverTripsScreen} />
                <Stack.Screen name="FuelStations" component={FuelStationsScreen} />
                <Stack.Screen name="DriverDocuments" component={DriverDocumentsScreen} />
                <Stack.Screen name="Rating" component={RatingScreen} />
                <Stack.Screen name="Settings" component={CustomerSettingsScreen} />
                <Stack.Screen name="Transactions" component={TransactionsScreen} />
                <Stack.Screen name="SupportTickets" component={SupportTicketsScreen} />
                <Stack.Screen name="NewTicket" component={NewTicketScreen} />
                <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
              </>
            )}

          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
      </QueryClientProvider>
    </ThemeProvider>
  );
};
const LoadingGate = () => {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.BACKGROUND }]}>
      <Text style={{ color: colors.TEXT_PRIMARY }}>Loading...</Text>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});