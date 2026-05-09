// import React, { useEffect, useState } from 'react';
// import { StyleSheet, Text, View } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// // Auth Screens
// import Splash from './Screens/AuthScreens/Splash';
// import OnBoarding from './Screens/AuthScreens/onBoarding'; // Fixed casing
// import Login from './Screens/AuthScreens/Login';
// import Signup from './Screens/AuthScreens/Signup';
// import SelectAccount from './Screens/AuthScreens/SelectAccount';

// // Main App Screens
// import HomeTabs from './Screens/navigation/HomeTabs';
// import { getToken, storage } from './src/services/storage'; // Fixed import path
// import notification from './Screens/HomeScreens/notification';
// import SearchScreen from './Screens/Search/SearchScreen';
// import CheckRate from './Screens/HomeScreens/CheckRate';
// import ShipmentDetailsScreen from './Screens/HomeScreens/ShipmentDetailsScreen/ShipmentDetailsScreen';
// import message from './Screens/HomeScreens/message';
// import ChatScreen from './Screens/HomeScreens/Message/ChatScreen';
// import ProfileScreen from './Screens/HomeScreens/Profile';
// import Sender from './Screens/addOrder/sender';
// import HomeScreen from './Screens/Driver/HomeScreen/HomeScreen';
// import NewOrder from './Screens/HomeScreens/addOrders';
// import ShipmentScreen from './Screens/HomeScreens/shipment';
// import DriverTabs from './Screens/Driver/HomeScreen/HomeScreenDrive';

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

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Auth Screens
import Splash from './Screens/AuthScreens/Splash';
import OnBoarding from './Screens/AuthScreens/onBoarding';
import Login from './Screens/AuthScreens/Login';
import Signup from './Screens/AuthScreens/Signup';
import SelectAccount from './Screens/AuthScreens/SelectAccount';

// Main App
import HomeTabs from './Screens/navigation/HomeTabs';
import DriverTabs from './Screens/Driver/HomeScreen/HomeScreenDrive';

// Screens
import notification from './Screens/HomeScreens/notification';
import SearchScreen from './Screens/Search/SearchScreen';
import CheckRate from './Screens/HomeScreens/CheckRate';
import ShipmentDetailsScreen from './Screens/HomeScreens/ShipmentDetailsScreen/ShipmentDetailsScreen';
import message from './Screens/HomeScreens/message';
import ChatScreen from './Screens/HomeScreens/Message/ChatScreen';
import ProfileScreen from './Screens/HomeScreens/Profile';
import Sender from './Screens/addOrder/sender';
import NewOrder from './Screens/HomeScreens/addOrders';
import ShipmentScreen from './Screens/HomeScreens/shipment';
import { useAuthState } from './hooks/useAuthState';

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

const App = () => {
  const { isAuthenticated } = useAuthState();

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>

            {!isAuthenticated ? (
              // 🔐 AUTH FLOW
              <>
                <Stack.Screen name="Splash" component={Splash} />
                <Stack.Screen name="OnBoarding" component={OnBoarding} />
                <Stack.Screen name="SelectAccount" component={SelectAccount} />
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="Signup" component={Signup} />
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
                <Stack.Screen name="shipment" component={ShipmentScreen} />
                <Stack.Screen name="message" component={message} />
                <Stack.Screen name="ChatScreen" component={ChatScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="addOrder" component={NewOrder} />
                <Stack.Screen name="Sender" component={Sender} />
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