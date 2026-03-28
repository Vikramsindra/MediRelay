function cleanBaseUrl(url) {
  return String(url || '').trim().replace(/\/$/, '');
}

function getExpoHost() {
  try {
    const Constants = require('expo-constants').default;
    const hostUri = Constants?.expoConfig?.hostUri
      || Constants?.manifest2?.extra?.expoGo?.debuggerHost
      || Constants?.manifest?.debuggerHost;

    if (!hostUri) return '';
    return String(hostUri).split(':')[0];
  } catch (_error) {
    return '';
  }
}

function resolveApiBaseUrl() {
  const configured = cleanBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (configured) return configured;

  const expoHost = getExpoHost();
  if (expoHost) return `http://${expoHost}:8080`;

  return 'http://localhost:8080';
}

const API_BASE_URL = resolveApiBaseUrl();
const USERS_ENDPOINT = `${API_BASE_URL}/api/v1/users`;

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (_error) {
    return {};
  }
}

async function getJsonOrThrow(response, fallbackMessage) {
  const body = await parseJsonSafe(response);
  if (!response.ok || !body?.success) {
    throw new Error(body?.message || fallbackMessage);
  }
  return body;
}

export async function signupUser(payload) {
  const response = await fetch(`${USERS_ENDPOINT}/signup`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await getJsonOrThrow(response, 'Failed to sign up');

  return {
    userId: String(body?.userId || body?.doctorId || ''),
    email: String(body?.email || payload?.email || '').toLowerCase(),
    name: String(body?.name || payload?.name || ''),
    hospitalName: String(body?.hospitalName || payload?.hospitalName || ''),
  };
}

export async function loginUser(payload) {
  const response = await fetch(`${USERS_ENDPOINT}/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await getJsonOrThrow(response, 'Failed to log in');

  return {
    userId: String(body?.userId || body?.doctorId || ''),
    email: String(body?.email || payload?.email || '').toLowerCase(),
    name: String(body?.name || ''),
    hospitalName: String(body?.hospitalName || ''),
  };
}

export async function logoutUser(payload = {}) {
  const response = await fetch(`${USERS_ENDPOINT}/logout`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  await parseJsonSafe(response);
  return true;
}
