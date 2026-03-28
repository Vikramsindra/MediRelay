import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import PatientListScreen from '../screens/PatientListScreen';
import PatientProfileScreen from '../screens/PatientProfileScreen';
import HistoryScreen from '../screens/HistoryScreen';
import PatientRegistrationScreen from '../screens/PatientRegistrationScreen';
import TransferFormScreen from '../screens/TransferFormScreen';
import DrugConflictScreen from '../screens/DrugConflictScreen';
import QRDisplayScreen from '../screens/QRDisplayScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import RecordViewerScreen from '../screens/RecordViewerScreen';
import BottomTabBar from './BottomTabBar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom tab navigator — 3 tabs as per UX spec
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Patients" component={PatientListScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

// Root stack — handles auth + all modal/push screens
export default function AppNavigator() {
  const [isAuthed, setIsAuthed] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isAuthed ? (
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} onAuth={() => setIsAuthed(true)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="PatientList" component={PatientListScreen} />
            <Stack.Screen name="PatientProfile" component={PatientProfileScreen} />
            <Stack.Screen name="PatientRegistration" component={PatientRegistrationScreen} />
            <Stack.Screen name="TransferForm" component={TransferFormScreen} />
            <Stack.Screen
              name="DrugConflict"
              component={DrugConflictScreen}
              options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
            />
            <Stack.Screen name="QRDisplay" component={QRDisplayScreen} />
            <Stack.Screen name="QRScanner" component={QRScannerScreen} />
            <Stack.Screen name="RecordViewer" component={RecordViewerScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
