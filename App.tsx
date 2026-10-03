import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
// Must run before any component using useTranslation() mounts.
import './src/i18n';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Sentry from '@sentry/react-native';
import { initSentry, navigationIntegration } from '@config/sentry';

// As early as possible, before the component tree renders — a no-op
// until a real DSN is set (see src/config/sentry.ts).
initSentry();
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/api/queryClient';
import { initNetworkMonitoring } from './src/api/network';
import { GlobalToast } from '@ui/alert/GlobalToast';
import { GlobalDeliveryOtpModal } from '@ui/alert/GlobalDeliveryOtpModal';
import { GlobalDeliveryCompletionSheet } from '@ui/alert/GlobalDeliveryCompletionSheet';
import { GlobalConfirmDialog } from '@ui/alert/GlobalConfirmDialog';
import { registerFCMToken, setupFCMListeners } from '@utils/cm';
import {
  navigationRef,
  flushPendingNotificationTarget,
} from '@features/notifications/deepLink';
import { ThemeProvider, useAppTheme } from '@theme/ThemeContext';
import Splash from '@screens/AuthScreens/Splash';
import LanguageSelect from '@screens/AuthScreens/LanguageSelect';
import OnBoarding from '@screens/AuthScreens/onBoarding';
import Login from '@screens/AuthScreens/Login';
import Signup from '@screens/AuthScreens/Signup';
import ForgotPassword from '@screens/AuthScreens/ForgotPassword';
import SelectAccount from '@screens/AuthScreens/SelectAccount';
import HomeTabs from '@screens/navigation/HomeTabs';
import DriverTabs from '@screens/Driver/HomeScreen/HomeScreenDrive';
import DriverSettingsScreen from '@screens/Driver/SettingsScreen';
import DriverTripsScreen from '@screens/Driver/TripsScreen';
import DriverEarningsScreen from '@screens/Driver/EarningsScreen';
import FuelStationsScreen from '@screens/Driver/FuelStationsScreen';
import DriverDocumentsScreen from '@screens/Driver/DriverDocumentsScreen';
import RatingScreen from '@screens/HomeScreens/RatingScreen';
import CustomerSettingsScreen from '@screens/HomeScreens/SettingsScreen';
import TransactionsScreen from '@screens/HomeScreens/TransactionsScreen';
import SupportTicketsScreen from '@screens/HomeScreens/SupportTicketsScreen';
import SavedAddressesScreen from '@screens/HomeScreens/SavedAddressesScreen';
import NewTicketScreen from '@screens/HomeScreens/NewTicketScreen';
import TicketDetailScreen from '@screens/HomeScreens/TicketDetailScreen';
import notification from '@screens/HomeScreens/notification';
import SearchScreen from '@screens/Search/SearchScreen';
import CheckRate from '@screens/HomeScreens/CheckRate';
import ShipmentDetailsScreen from '@screens/HomeScreens/ShipmentDetailsScreen/ShipmentDetailsScreen';
import LocationPinPicker from '@screens/Location/LocationPinPicker';
import WebViewScreen from '@screens/HomeScreens/WebViewScreen';
import ReceiptScreen from '@screens/HomeScreens/ReceiptScreen';
import ReferralScreen from '@screens/HomeScreens/ReferralScreen';
import ShipmentChatScreen from '@screens/HomeScreens/ShipmentChatScreen';
import InboxScreen from '@screens/HomeScreens/InboxScreen';
import QRScanScreen from '@screens/Search/QRScanScreen';
import ProfileScreen from '@screens/HomeScreens/Profile';
import Sender from '@screens/addOrder/sender';
import NewOrder from '@screens/HomeScreens/addOrders';
import ShipmentScreen from '@screens/HomeScreens/shipment';
import { useAuthState } from '@hooks/useAuthState';
import { useAuthStore } from '@features/store/authStore';
import { useNotificationsSocket } from '@features/notifications/hooks';

const Stack = createNativeStackNavigator();

// Needs to run under QueryClientProvider (useQueryClient) — App itself
// renders that provider, so this can't be called at App's own top level.
const NotificationsSocketBridge = () => {
  useNotificationsSocket();
  return null;
};

const App = () => {
  const { isAuthenticated } = useAuthState();
  const role = useAuthStore(s => s.user?.role);
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
    // Real OS notification + deep link on tap — no in-app Alert popup
    // (see utils/cm.ts: foreground messages now post a real local
    // notification via notifee instead of showing a custom dialog).
    const unsub = setupFCMListeners();
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
          <BottomSheetModalProvider>
            <NotificationsSocketBridge />
            <GlobalToast />
            <GlobalDeliveryOtpModal />
            <GlobalDeliveryCompletionSheet />
            <GlobalConfirmDialog />
            <NavigationContainer
              ref={navigationRef}
              onReady={() => {
                navigationIntegration.registerNavigationContainer(
                  navigationRef,
                );
                flushPendingNotificationTarget();
              }}
            >
              <Stack.Navigator
                screenOptions={{ headerShown: false }}
                initialRouteName={
                  showAppFlow && role === 'DRIVER' ? 'DriverTabs' : undefined
                }
              >
                {!showAppFlow ? (
                  <>
                    <Stack.Screen name="Splash" component={Splash} />
                    <Stack.Screen
                      name="LanguageSelect"
                      component={LanguageSelect}
                    />
                    <Stack.Screen name="OnBoarding" component={OnBoarding} />
                    <Stack.Screen
                      name="SelectAccount"
                      component={SelectAccount}
                    />
                    <Stack.Screen name="Login" component={Login} />
                    <Stack.Screen name="Signup" component={Signup} />
                    <Stack.Screen
                      name="ForgotPassword"
                      component={ForgotPassword}
                    />
                  </>
                ) : (
                  <>
                    <Stack.Screen name="Home" component={HomeTabs} />
                    <Stack.Screen name="DriverTabs" component={DriverTabs} />
                    <Stack.Screen
                      name="Notification"
                      component={notification}
                    />
                    <Stack.Screen name="Search" component={SearchScreen} />
                    <Stack.Screen name="CheckRate" component={CheckRate} />
                    <Stack.Screen
                      name="ShipmentDetailsScreen"
                      component={ShipmentDetailsScreen}
                    />
                    <Stack.Screen
                      name="LocationPinPicker"
                      component={LocationPinPicker}
                      options={{ animation: 'slide_from_bottom' }}
                    />
                    <Stack.Screen name="WebView" component={WebViewScreen} />
                    <Stack.Screen name="Receipt" component={ReceiptScreen} />
                    <Stack.Screen name="Referral" component={ReferralScreen} />
                    <Stack.Screen
                      name="ShipmentChat"
                      component={ShipmentChatScreen}
                    />
                    <Stack.Screen name="Inbox" component={InboxScreen} />
                    <Stack.Screen name="QRScan" component={QRScanScreen} />
                    <Stack.Screen name="shipment" component={ShipmentScreen} />
                    <Stack.Screen name="Profile" component={ProfileScreen} />
                    <Stack.Screen name="addOrder" component={NewOrder} />
                    <Stack.Screen name="Sender" component={Sender} />
                    <Stack.Screen
                      name="DriverSettings"
                      component={DriverSettingsScreen}
                    />
                    <Stack.Screen
                      name="DriverTrips"
                      component={DriverTripsScreen}
                    />
                    <Stack.Screen
                      name="DriverEarnings"
                      component={DriverEarningsScreen}
                    />
                    <Stack.Screen
                      name="FuelStations"
                      component={FuelStationsScreen}
                    />
                    <Stack.Screen
                      name="DriverDocuments"
                      component={DriverDocumentsScreen}
                    />
                    <Stack.Screen name="Rating" component={RatingScreen} />
                    <Stack.Screen
                      name="Settings"
                      component={CustomerSettingsScreen}
                    />
                    <Stack.Screen
                      name="Transactions"
                      component={TransactionsScreen}
                    />
                    <Stack.Screen
                      name="SupportTickets"
                      component={SupportTicketsScreen}
                    />
                    <Stack.Screen
                      name="SavedAddresses"
                      component={SavedAddressesScreen}
                    />
                    <Stack.Screen
                      name="NewTicket"
                      component={NewTicketScreen}
                    />
                    <Stack.Screen
                      name="TicketDetail"
                      component={TicketDetailScreen}
                    />
                  </>
                )}
              </Stack.Navigator>
            </NavigationContainer>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ThemeProvider>
  );
};
const LoadingGate = () => {
  const { colors } = useAppTheme();
  return (
    <View
      style={[styles.loadingContainer, { backgroundColor: colors.BACKGROUND }]}
    >
      <Text style={{ color: colors.TEXT_PRIMARY }}>Loading...</Text>
    </View>
  );
};

// Adds an automatic top-level error boundary + touch breadcrumbs — a
// no-op wrapper when Sentry was never initialized (no DSN set).
export default Sentry.wrap(App);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
