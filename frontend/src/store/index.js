// Global mock store — simulates app state across screens
// In production replace with Zustand / Redux / Context

let _state = {
  doctor: {
    userId: '',
    name: 'Dr. Aris Sharma',
    hospital: 'Apollo Hospital',
    email: '',
    phone: '9876543210',
    isLoggedIn: true,
  },
  isOnline: true,
  patients: [],
  transfers: [],
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
