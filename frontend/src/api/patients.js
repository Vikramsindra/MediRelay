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
const PATIENTS_ENDPOINT = `${API_BASE_URL}/api/v1/patients`;

function buildSearchUrl(search, doctorId) {
  const params = new URLSearchParams();
  params.set('doctorId', String(doctorId || '').trim());
  if (search && String(search).trim()) params.set('search', String(search).trim());
  return `${PATIENTS_ENDPOINT}/search?${params.toString()}`;
}

function normalizePhone(value) {
  const phone = String(value || '').trim();
  return phone.length > 0 ? phone : undefined;
}

function mapPatientFromApi(rawPatient) {
  const allergies = Array.isArray(rawPatient?.allergies)
    ? rawPatient.allergies.map((item) => ({
      allergen: String(item?.allergen || '').trim(),
      reaction: String(item?.reaction || '').trim(),
    }))
    : [];

  const medications = Array.isArray(rawPatient?.permanentMedications)
    ? rawPatient.permanentMedications.map((item) => ({
      name: String(item?.name || '').trim(),
      dose: String(item?.dose || '').trim(),
      route: String(item?.route || '').trim(),
      frequency: String(item?.frequency || '').trim(),
      mustNotStop: false,
    }))
    : [];

  return {
    id: rawPatient?._id || rawPatient?.id || `P${Date.now()}`,
    doctorId: String(rawPatient?.doctorId || ''),
    name: String(rawPatient?.fullName || '').trim(),
    age: Number(rawPatient?.age || 0),
    sex: rawPatient?.sex || '',
    bloodGroup: rawPatient?.bloodGroup || '',
    phone: String(rawPatient?.phone || '').trim(),
    emergencyContact: {
      name: String(rawPatient?.emergencyContact?.name || '').trim(),
      phone: String(rawPatient?.emergencyContact?.phone || '').trim(),
      relation: String(rawPatient?.emergencyContact?.relation || '').trim(),
    },
    noAllergies: Boolean(rawPatient?.noKnownAllergies),
    allergies,
    conditions: Array.isArray(rawPatient?.chronicConditions) ? rawPatient.chronicConditions : [],
    noMeds: Boolean(rawPatient?.noRegularMedications),
    medications,
  };
}

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

export function buildPatientCreatePayload(formValues, doctorId) {
  const {
    name,
    age,
    sex,
    bloodGroup,
    phone,
    ecName,
    ecPhone,
    ecRelation,
    noAllergies,
    allergies,
    conditions,
    noMeds,
    medications,
  } = formValues;

  return {
    doctorId,
    fullName: String(name || '').trim(),
    age: Number(age),
    sex,
    bloodGroup,
    phone: normalizePhone(phone),
    emergencyContact: {
      name: String(ecName || '').trim(),
      phone: normalizePhone(ecPhone),
      relation: String(ecRelation || '').trim(),
    },
    noKnownAllergies: Boolean(noAllergies),
    allergies: noAllergies ? [] : allergies,
    chronicConditions: Array.isArray(conditions) ? conditions : [],
    noRegularMedications: Boolean(noMeds),
    permanentMedications: noMeds ? [] : medications.map((m) => ({
      name: String(m?.name || '').trim(),
      dose: String(m?.dose || '').trim(),
      route: String(m?.route || '').trim(),
      frequency: String(m?.frequency || '').trim(),
    })),
  };
}

export async function createPatient(payload) {
  const response = await fetch(PATIENTS_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await getJsonOrThrow(response, 'Failed to register patient');
  return mapPatientFromApi(body?.data);
}

export async function searchPatients(search, doctorId) {
  const response = await fetch(buildSearchUrl(search, doctorId), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  const body = await getJsonOrThrow(response, 'Failed to fetch patients');
  const items = Array.isArray(body?.data) ? body.data : [];
  return items.map(mapPatientFromApi);
}

export async function getPatientById(patientId, doctorId) {
  const params = new URLSearchParams({ doctorId: String(doctorId || '').trim() });
  const response = await fetch(`${PATIENTS_ENDPOINT}/${patientId}?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  const body = await getJsonOrThrow(response, 'Failed to fetch patient details');
  return mapPatientFromApi(body?.data);
}
