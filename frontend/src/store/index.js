// Global mock store — simulates app state across screens
// In production replace with Zustand / Redux / Context

let _state = {
  doctor: {
    name: 'Dr. Aris Sharma',
    hospital: 'Apollo Hospital',
    phone: '9876543210',
    isLoggedIn: true,
  },
  isOnline: true,
  patients: [
    {
      id: 'P001',
      name: 'Ramesh Kumar',
      age: 54,
      sex: 'M',
      bloodGroup: 'O+',
      phone: '9876500001',
      emergencyContact: { name: 'Sunita Kumar', phone: '9876500002', relation: 'Wife' },
      allergies: [
        { allergen: 'Penicillin', reaction: 'Anaphylaxis' },
        { allergen: 'Aspirin', reaction: 'Rash' },
      ],
      conditions: ['Diabetes', 'Hypertension'],
      medications: [
        { name: 'Metoprolol', dose: '25mg', route: 'Oral', frequency: 'Twice daily', mustNotStop: true },
        { name: 'Aspirin', dose: '75mg', route: 'Oral', frequency: 'Once daily', mustNotStop: false },
      ],
    },
    {
      id: 'P002',
      name: 'Priya Mehta',
      age: 32,
      sex: 'F',
      bloodGroup: 'B+',
      phone: '9876500003',
      emergencyContact: { name: 'Rajesh Mehta', phone: '9876500004', relation: 'Husband' },
      allergies: [],
      conditions: [],
      medications: [],
    },
  ],
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
