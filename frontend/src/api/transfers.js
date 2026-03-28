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
const TRANSFERS_ENDPOINT = `${API_BASE_URL}/api/v1/transfers`;

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

function mapTransferStatus(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'acknowledged') return 'Acknowledged';
  if (normalized === 'submitted') return 'Pending';
  if (normalized === 'draft') return 'Pending';
  return 'Pending';
}

export function mapTransferFromApi(rawTransfer) {
  const patientName = String(rawTransfer?.patient?.fullName || '').trim();
  const patientId = String(rawTransfer?.patientId || rawTransfer?.patient?._id || '');
  const createdAt = rawTransfer?.createdAt || rawTransfer?.timestamp || new Date().toISOString();
  const bpRaw = String(rawTransfer?.vitals?.bp || '').trim();
  const [bpSys, bpDia] = bpRaw.includes('/') ? bpRaw.split('/') : ['', ''];

  return {
    id: String(rawTransfer?._id || rawTransfer?.id || `TR-${Date.now()}`),
    patientId,
    patientName,
    direction: 'sent',
    conditionCategory: String(rawTransfer?.conditionCategory || '').trim(),
    severity: String(rawTransfer?.severity || '').trim(),
    diagnosis: String(rawTransfer?.chiefComplaint || '').trim(),
    to: String(rawTransfer?.receivingHospital || '').trim(),
    from: String(rawTransfer?.sendingHospital || '').trim(),
    status: mapTransferStatus(rawTransfer?.status),
    createdAt,
    vitals: {
      bpSys: String(bpSys || '').trim(),
      bpDia: String(bpDia || '').trim(),
      hr: rawTransfer?.vitals?.hr || '',
      spo2: rawTransfer?.vitals?.spo2 || '',
      temp: rawTransfer?.vitals?.temp || '',
      rr: rawTransfer?.vitals?.rr || '',
      gcs: rawTransfer?.vitals?.gcs || '',
      bsl: rawTransfer?.vitals?.bloodSugar || '',
    },
    summary: String(rawTransfer?.clinicalSummary || '').trim(),
    investigations: Array.isArray(rawTransfer?.pendingInvestigations)
      ? rawTransfer.pendingInvestigations
      : [],
    transferMode: String(rawTransfer?.modeOfTransfer || '').trim(),
    activeMeds: Array.isArray(rawTransfer?.activeMedications)
      ? rawTransfer.activeMedications
      : [],
    shareId: String(rawTransfer?.shareId || ''),
  };
}

export async function createTransfer(payload) {
  const response = await fetch(TRANSFERS_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await getJsonOrThrow(response, 'Failed to create transfer');
  return {
    transfer: mapTransferFromApi(body?.data),
    link: body?.link || '',
  };
}

export async function fetchTransfers({ doctorId, patientId } = {}) {
  const params = new URLSearchParams();
  if (doctorId) params.set('doctorId', String(doctorId).trim());
  if (patientId) params.set('patientId', String(patientId).trim());

  const query = params.toString();
  const url = query ? `${TRANSFERS_ENDPOINT}?${query}` : TRANSFERS_ENDPOINT;

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  const body = await getJsonOrThrow(response, 'Failed to load transfer history');
  const items = Array.isArray(body?.data) ? body.data : [];
  return items.map(mapTransferFromApi);
}

export async function getTransferById(transferId) {
  const response = await fetch(`${TRANSFERS_ENDPOINT}/${transferId}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  const body = await getJsonOrThrow(response, 'Failed to fetch transfer');
  return mapTransferFromApi(body?.data);
}
