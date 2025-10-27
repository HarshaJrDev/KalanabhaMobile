import 'react-native-gesture-handler'
import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Splash from './Screens/AuthScreens/Splash';
import onBoarding from './Screens/AuthScreens/onBoarding';
import Login from './Screens/AuthScreens/Login';
import SelectAccount from './Screens/AuthScreens/SelectAccount';
import Home from './Screens/HomeScreens/Home';
import HomeTabs from './Screens/navigation/HomeTabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import notification from './Screens/HomeScreens/notification';


const App = () => {
  const Stack = createNativeStackNavigator();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer >
        <Stack.Navigator initialRouteName='Home' screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={Splash} />
          <Stack.Screen name="OnBoarding" component={onBoarding} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="SelectAccount" component={SelectAccount} />
          <Stack.Screen name="Home" component={HomeTabs} />
          <Stack.Screen name="Notification" component={notification} />
        </Stack.Navigator>
      </NavigationContainer>


    </GestureHandlerRootView>

  );
};

export default App;

const styles = StyleSheet.create({});
