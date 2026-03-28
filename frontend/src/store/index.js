// Global mock store — simulates app state across screens
// Patients are loaded from backend on app initialization

let _state = {
  doctor: {
    name: 'Dr. Aris Sharma',
    hospital: 'Apollo Hospital',
    phone: '9876543210',
    isLoggedIn: true,
  },
  isOnline: true,
  patients: [],
  transfers: [
    {
      id: 'TR-4820',
      patientId: 'P002',
      patientName: 'Priya Mehta',
      direction: 'sent',
      conditionCategory: 'Trauma',
      severity: 'Stable',
      diagnosis: 'Fracture',
      to: 'AIIMS',
      status: 'Acknowledged',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'TR-4819',
      patientId: 'P001',
      patientName: 'Ramesh Kumar',
      direction: 'received',
      conditionCategory: 'Cardiac',
      severity: 'Critical',
      diagnosis: 'Acute MI',
      from: 'City Hospital',
      status: 'Pending',
      createdAt: new Date(Date.now() - 720000).toISOString(),
    },
  ],
  // Active transfer being composed
  draftTransfer: null,
};

const _listeners = new Set();

export function getState() {
  return _state;
}

export function setState(updater) {
  _state = typeof updater === 'function' ? updater(_state) : { ..._state, ...updater };
  _listeners.forEach((fn) => fn(_state));
}

export function subscribe(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export async function loadPatientsFromBackend() {
  try {
    const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
    const url = `${API_BASE_URL}/api/v1/patients/search`;
    console.log('[Store] Loading patients from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    console.log('[Store] Fetch response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('[Store] Failed to fetch patients from backend:', response.statusText, 'body:', errorText);
      return;
    }

    const text = await response.text();
    console.log('[Store] Response text length:', text.length);
    
    if (!text) {
      console.warn('[Store] Empty response text');
      return;
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (_error) {
      console.warn('[Store] Failed to parse patients response:', _error?.message);
      return;
    }

    console.log('[Store] Parsed response:', body?.success, 'data length:', Array.isArray(body?.data) ? body.data.length : 'not array');

    if (!body?.success || !Array.isArray(body?.data)) {
      console.warn('[Store] Unexpected patients response format');
      return;
    }

    const { mapPatientFromApi } = require('../api/patients');
    const mappedPatients = body.data.map(mapPatientFromApi);
    console.log('[Store] Mapped', mappedPatients.length, 'patients');
    setState((s) => ({ ...s, patients: mappedPatients }));
  } catch (error) {
    console.warn('[Store] Error loading patients from backend:', error?.message);
  }
}

export function useStore() {
  const { useState, useEffect } = require('react');
  const [s, setS] = useState(_normalizeState(_state));
  useEffect(() => {
    const unsub = subscribe((nextState) => {
      setS(_normalizeState(nextState));
    });
    return unsub;
  }, []);
  return s;
}

function _normalizeState(state) {
  return {
    ...state,
    patients: (state.patients || []).map(p => ({
      ...p,
      allergies: Array.isArray(p.allergies) ? p.allergies.map(a => {
        if (typeof a === 'object' && a !== null && 'allergen' in a) {
          return { allergen: String(a.allergen || ''), reaction: String(a.reaction || '') };
        }
        return { allergen: String(a || ''), reaction: '' };
      }) : [],
    })),
  };
}
