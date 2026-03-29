import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import PatientListScreen from '../screens/PatientListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import PatientHomeScreen from '../screens/PatientHomeScreen';
import PatientHistoryScreen from '../screens/PatientHistoryScreen';
import PatientGuestRecordScreen from '../screens/PatientGuestRecordScreen';
import PatientProfileScreen from '../screens/PatientProfileScreen';
import PatientSearchScreen from '../screens/PatientSearchScreen';
import HistoryScreen from '../screens/HistoryScreen';
import PatientRegistrationScreen from '../screens/PatientRegistrationScreen';
import TransferFormScreen from '../screens/TransferFormScreen';
import DrugConflictScreen from '../screens/DrugConflictScreen';
import QRDisplayScreen from '../screens/QRDisplayScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import RecordViewerScreen from '../screens/RecordViewerScreen';
import AckConfirmationScreen from '../screens/AckConfirmationScreen';
import BottomTabBar from './BottomTabBar';
import PatientBottomTabBar from './PatientBottomTabBar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom tab navigator — 4 tabs as per UX spec
function MainTabs({ onLogout }) {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Patients" component={PatientListScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile">
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function PatientTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <PatientBottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={PatientHomeScreen} />
      <Tab.Screen name="History" component={PatientHistoryScreen} />
    </Tab.Navigator>
  );
}

// Root stack — handles auth + all modal/push screens
export default function AppNavigator() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [userType, setUserType] = useState('doctor');

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isAuthed ? (
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} onAuth={(type = 'doctor') => {
              setUserType(type);
              setIsAuthed(true);
            }} />}
          </Stack.Screen>
        ) : (
          <>
            {userType === 'patient' ? (
              <>
                <Stack.Screen name="PatientMain" component={PatientTabs} />
                <Stack.Screen name="PatientTransferDetail" component={PatientHistoryScreen} />
                <Stack.Screen name="PatientGuestRecord" component={PatientGuestRecordScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="Main">
                  {(props) => <MainTabs {...props} onLogout={() => {
                    setUserType('doctor');
                    setIsAuthed(false);
                  }} />}
                </Stack.Screen>
                <Stack.Screen name="PatientList" component={PatientListScreen} />
                <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
                <Stack.Screen name="PatientProfile" component={PatientProfileScreen} />
                <Stack.Screen name="PatientSearch" component={PatientSearchScreen} />
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
                <Stack.Screen
                  name="AckConfirmation"
                  component={AckConfirmationScreen}
                  options={{ animation: 'slide_from_bottom' }}
                />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
