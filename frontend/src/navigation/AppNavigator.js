import React, { useEffect, useState } from 'react';
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
import { setState } from '../store';
import { buildApiUrl, API_PATHS } from '../api/config';

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

  useEffect(() => {
    if (!isAuthed) return;

    const hydrateFromBackend = async () => {
      try {
        const [patientsRes, transfersRes] = await Promise.all([
          fetch(buildApiUrl(API_PATHS.patients)),
          fetch(buildApiUrl(API_PATHS.transfers)),
        ]);

        const patientsJson = patientsRes.ok ? await patientsRes.json() : { data: [] };
        const transfersJson = transfersRes.ok ? await transfersRes.json() : { data: [] };

        const apiPatients = Array.isArray(patientsJson?.data) ? patientsJson.data : [];
        const apiTransfers = Array.isArray(transfersJson?.data) ? transfersJson.data : [];

        if (apiPatients.length === 0 && apiTransfers.length === 0) return;

        const mappedPatients = apiPatients.map((p) => ({
          id: p._id,
          name: p.fullName,
          age: p.age,
          sex: p.sex,
          bloodGroup: p.bloodGroup,
          phone: p.phone,
          emergencyContact: p.emergencyContact ?? {},
          allergies: p.allergies ?? [],
          conditions: p.chronicConditions ?? [],
          medications: p.permanentMedications ?? [],
        }));

        const mappedTransfers = apiTransfers.map((t) => ({
          id: t._id,
          patientId: t.patient?._id ?? t.patientId,
          patientName: t.patient?.fullName ?? 'Unknown Patient',
          direction: t.receivingHospital ? 'received' : 'sent',
          conditionCategory: t.conditionCategory,
          severity: t.severity,
          diagnosis: t.chiefComplaint,
          from: t.sendingHospital,
          to: t.receivingHospital,
          status: t.status,
          createdAt: t.createdAt,
          activeMeds: t.activeMedications ?? [],
          vitals: t.vitals ?? {},
          shareId: t.shareId,
        }));

        setState((s) => ({
          ...s,
          patients: mappedPatients.length > 0 ? mappedPatients : s.patients,
          transfers: mappedTransfers.length > 0 ? mappedTransfers : s.transfers,
        }));
      } catch (error) {
        // Keep existing in-memory mock state when backend is unavailable.
      }
    };

    hydrateFromBackend();
  }, [isAuthed]);

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
