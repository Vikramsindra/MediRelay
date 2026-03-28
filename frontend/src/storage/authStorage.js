import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_SESSION_KEY = 'medirelay.auth.session';

export async function saveAuthSession(session) {
  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export async function loadAuthSession() {
  const raw = await AsyncStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.userId) return null;
    return parsed;
  } catch (_error) {
    return null;
  }
}

export async function clearAuthSession() {
  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
}

export async function getStoredDoctorId() {
  const session = await loadAuthSession();
  const userId = String(session?.userId || '').trim();
  return userId || '';
}
