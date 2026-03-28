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

function normalizePhone(value) {
  const phone = String(value || '').trim();
  return phone.length > 0 ? phone : undefined;
}

function mapAllergiesForApi(allergies) {
  if (!Array.isArray(allergies)) return [];
  return allergies
    .map((item) => ({
      allergen: String(item?.allergen || '').trim(),
      reaction: String(item?.reaction || '').trim(),
    }))
    .filter((item) => item.allergen.length > 0);
}

function mapMedicationsForApi(medications) {
  if (!Array.isArray(medications)) return [];
  return medications
    .map((item) => ({
      name: String(item?.name || '').trim(),
      dose: String(item?.dose || '').trim(),
      route: String(item?.route || '').trim(),
      frequency: String(item?.frequency || '').trim(),
    }))
    .filter((item) => item.name.length > 0);
}

function buildPatientsSearchUrl(search) {
  const params = new URLSearchParams({ search: String(search || '').trim() });
  return `${PATIENTS_ENDPOINT}/search?${params.toString()}`;
}

export function buildPatientCreatePayload(formValues) {
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
    allergies: noAllergies ? [] : mapAllergiesForApi(allergies),
    chronicConditions: Array.isArray(conditions) ? conditions : [],
    noRegularMedications: Boolean(noMeds),
    permanentMedications: noMeds ? [] : mapMedicationsForApi(medications),
  };
}

export function mapPatientFromApi(rawPatient) {
  const allergies = Array.isArray(rawPatient?.allergies)
    ? rawPatient.allergies.map((item) => ({
      allergen: String(item?.allergen || '').trim(),
      reaction: String(item?.reaction || '').trim(),
    })).filter((item) => item.allergen)
    : [];

  const medications = Array.isArray(rawPatient?.permanentMedications)
    ? rawPatient.permanentMedications.map((item) => ({
      name: String(item?.name || '').trim(),
      dose: String(item?.dose || '').trim(),
      route: String(item?.route || '').trim(),
      frequency: String(item?.frequency || '').trim(),
      mustNotStop: false,
    })).filter((item) => item.name)
    : [];

  return {
    id: rawPatient?._id || rawPatient?.id || `P${Date.now()}`,
    name: String(rawPatient?.fullName || rawPatient?.name || '').trim(),
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

  return mapPatientFromApi(body.data);
}

export async function searchPatients(search) {
  const response = await fetch(buildPatientsSearchUrl(search), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const body = await getJsonOrThrow(response, 'Failed to search patients');
  const items = Array.isArray(body?.data) ? body.data : [];
  return items.map(mapPatientFromApi);
}

export async function getPatientById(patientId) {
  const response = await fetch(`${PATIENTS_ENDPOINT}/${patientId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const body = await getJsonOrThrow(response, 'Failed to fetch patient details');
  return mapPatientFromApi(body.data);
}
