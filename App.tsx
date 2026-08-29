// import React, { useEffect, useState } from 'react';
// import { StyleSheet, Text, View } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// // Auth Screens
// import Splash from '@screens/AuthScreens/Splash';
// import OnBoarding from '@screens/AuthScreens/onBoarding'; // Fixed casing
// import Login from '@screens/AuthScreens/Login';
// import Signup from '@screens/AuthScreens/Signup';
// import SelectAccount from '@screens/AuthScreens/SelectAccount';

// // Main App Screens
// import HomeTabs from '@screens/navigation/HomeTabs';
// import { getToken, storage } from './src/services/storage'; // Fixed import path
// import notification from '@screens/HomeScreens/notification';
// import SearchScreen from '@screens/Search/SearchScreen';
// import CheckRate from '@screens/HomeScreens/CheckRate';
// import ShipmentDetailsScreen from '@screens/HomeScreens/ShipmentDetailsScreen/ShipmentDetailsScreen';
// import message from '@screens/HomeScreens/message';
// import ChatScreen from '@screens/HomeScreens/Message/ChatScreen';
// import ProfileScreen from '@screens/HomeScreens/Profile';
// import Sender from '@screens/addOrder/sender';
// import HomeScreen from '@screens/Driver/HomeScreen/HomeScreen';
// import NewOrder from '@screens/HomeScreens/addOrders';
// import ShipmentScreen from '@screens/HomeScreens/shipment';
// import DriverTabs from '@screens/Driver/HomeScreen/HomeScreenDrive';

// const Stack = createNativeStackNavigator();
// const queryClient = new QueryClient();

// const App = () => {
//   const [isLoading, setIsLoading] = useState(true);


//   const [token, setToken] = useState<string | null>(null);

//   console.log('token', token)

//   useEffect(() => {
//     setToken(getToken()); // ✅ Fully typed, no errors
//     setIsLoading(false);
//   }, []);

//   // Loading screen while checking auth
//   if (isLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Text>Loading...</Text>
//       </View>
//     );
//   }

//   return (
//     <QueryClientProvider client={queryClient}>
//       <GestureHandlerRootView style={{ flex: 1 }}>
//         <NavigationContainer>
//           <Stack.Navigator screenOptions={{ headerShown: false }}>
//             {/* Auth Flow - No Token */}
//             {!token ? (
//               <>
//                 <Stack.Screen name="Splash" component={Splash} />
//                 <Stack.Screen name="OnBoarding" component={OnBoarding} />
//                 <Stack.Screen name="Login" component={Login} />
//                 <Stack.Screen name="Signup" component={Signup} />
//                 <Stack.Screen name="Home" component={HomeTabs} />
//                 <Stack.Screen name="DriverTabs" component={DriverTabs} />
//                 <Stack.Screen name="SelectAccount" component={SelectAccount} />
//                 <Stack.Screen name="Profile" component={ProfileScreen} />

//               </>
//             ) : (
//               <>
//                 <Stack.Screen name="Login" component={Login} />
//                 <Stack.Screen name="SelectAccount" component={SelectAccount} />
//                 {/* Main App Flow - Has Token */}
//                 <Stack.Screen name="Home" component={HomeTabs} />
//                 <Stack.Screen name="Notification" component={notification} />
//                 <Stack.Screen name="Search" component={SearchScreen} />
//                 <Stack.Screen name="CheckRate" component={CheckRate} />
//                 <Stack.Screen name="ShipmentDetailsScreen" component={ShipmentDetailsScreen} />
//                 <Stack.Screen name="shipment" component={ShipmentScreen} />
//                 <Stack.Screen name="message" component={message} />
//                 <Stack.Screen name="ChatScreen" component={ChatScreen} />
//                 <Stack.Screen name="Profile" component={ProfileScreen} />
//                 <Stack.Screen name="addOrder" component={NewOrder} />
//                 <Stack.Screen name="Sender" component={Sender} />
//                 <Stack.Screen name="DriverTabs" component={DriverTabs} />
//               </>
//             )}
//           </Stack.Navigator>
//         </NavigationContainer>
//       </GestureHandlerRootView>
//     </QueryClientProvider>
//   );
// };

// export default App;

// const styles = StyleSheet.create({
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
// });

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/api/queryClient';
import { initNetworkMonitoring } from './src/api/network';
import { GlobalToast } from '@ui/alert/GlobalToast';

// Auth Screens
import Splash from '@screens/AuthScreens/Splash';
import OnBoarding from '@screens/AuthScreens/onBoarding';
import Login from '@screens/AuthScreens/Login';
import Signup from '@screens/AuthScreens/Signup';
import ForgotPassword from '@screens/AuthScreens/ForgotPassword';
import SelectAccount from '@screens/AuthScreens/SelectAccount';

// Main App
import HomeTabs from '@screens/navigation/HomeTabs';
import DriverTabs from '@screens/Driver/HomeScreen/HomeScreenDrive';
import DriverSettingsScreen from '@screens/Driver/SettingsScreen';
import DriverTripsScreen from '@screens/Driver/TripsScreen';
import CustomerSettingsScreen from '@screens/HomeScreens/SettingsScreen';
import TransactionsScreen from '@screens/HomeScreens/TransactionsScreen';

// Screens
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

  // A token alone isn't enough to pick the right landing screen — the role
  // (customer vs driver) only arrives once GET /users/me resolves, slightly
  // after the token is written (see useLogin/useRegister). Switching to the
  // app-flow screen set before that resolves used to default to "Home"
  // (the first Stack.Screen below) for every role, including drivers, and
  // an imperative navigation.reset() from Login.tsx afterwards was too late
  // — the screen set had already swapped out from under it. Waiting for
  // both here means the switch only ever happens once, straight to the
  // correct screen, decided declaratively by initialRouteName below.
  const showAppFlow = isAuthenticated && !!role;
  // Same race on cold start: a persisted token is readable from MMKV
  // synchronously, but the persisted role rehydrates into the Zustand
  // store a tick later. Rather than flash the auth-flow screens for a
  // returning, already-logged-in user, show a bare loading state for that
  // one tick instead of rendering either screen set.
  const resolvingSession = isAuthenticated && !role;

  // App-wide connectivity monitoring — powers apiClient's offline
  // fast-fail and TanStack Query's auto-pause/auto-refetch-on-reconnect.
  // Started once, here, rather than per-screen.
  useEffect(() => {
    const unsubscribe = initNetworkMonitoring();
    return unsubscribe;
  }, []);

  if (resolvingSession) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GlobalToast />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={showAppFlow && role === 'DRIVER' ? 'DriverTabs' : undefined}
          >

            {!showAppFlow ? (
              // 🔐 AUTH FLOW
              <>
                <Stack.Screen name="Splash" component={Splash} />
                <Stack.Screen name="OnBoarding" component={OnBoarding} />
                <Stack.Screen name="SelectAccount" component={SelectAccount} />
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="Signup" component={Signup} />
                <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
              </>
            ) : (
              // 🚀 APP FLOW
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
                <Stack.Screen name="Settings" component={CustomerSettingsScreen} />
                <Stack.Screen name="Transactions" component={TransactionsScreen} />
              </>
            )}

          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </QueryClientProvider>
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