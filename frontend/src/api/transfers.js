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
const LZString = require('lz-string');
const QR_PREFIX = 'MR1:';

function compactMedication(medication) {
  return {
    n: String(medication?.name || '').trim(),
    d: String(medication?.dose || '').trim(),
    r: String(medication?.route || '').trim(),
    f: String(medication?.frequency || '').trim(),
    m: Boolean(medication?.mustNotStop),
    l: String(medication?.lastGivenAt || '').trim(),
  };
}

function expandMedication(medication) {
  return {
    name: String(medication?.n || '').trim(),
    dose: String(medication?.d || '').trim(),
    route: String(medication?.r || '').trim(),
    frequency: String(medication?.f || '').trim(),
    mustNotStop: Boolean(medication?.m),
    lastGivenAt: String(medication?.l || '').trim(),
  };
}

function buildCompactTransferPayload(transfer) {
  return {
    i: String(transfer?.id || '').trim(),
    pi: String(transfer?.patientId || '').trim(),
    pn: String(transfer?.patientName || '').trim(),
    c: String(transfer?.conditionCategory || '').trim(),
    s: String(transfer?.severity || '').trim(),
    dg: String(transfer?.diagnosis || '').trim(),
    to: String(transfer?.to || '').trim(),
    fr: String(transfer?.from || '').trim(),
    st: String(transfer?.status || '').trim(),
    t: String(transfer?.createdAt || '').trim(),
    v: transfer?.vitals || {},
    sm: String(transfer?.summary || '').trim(),
    inv: Array.isArray(transfer?.investigations) ? transfer.investigations : [],
    tm: String(transfer?.transferMode || '').trim(),
    dr: String(transfer?.doctorName || '').trim(),
    m: Array.isArray(transfer?.activeMeds) ? transfer.activeMeds.map(compactMedication) : [],
    sh: String(transfer?.shareId || '').trim(),
    ps: transfer?.patientSnapshot
      ? {
        id: String(transfer?.patientSnapshot?.id || '').trim(),
        n: String(transfer?.patientSnapshot?.name || '').trim(),
        ai: String(transfer?.patientSnapshot?.abhaId || '').trim(),
        ar: Boolean(transfer?.patientSnapshot?.abhaRegistration),
        a: Number(transfer?.patientSnapshot?.age || 0),
        sx: String(transfer?.patientSnapshot?.sex || '').trim(),
        bg: String(transfer?.patientSnapshot?.bloodGroup || '').trim(),
        ph: String(transfer?.patientSnapshot?.phone || '').trim(),
        al: Array.isArray(transfer?.patientSnapshot?.allergies) ? transfer.patientSnapshot.allergies : [],
        md: Array.isArray(transfer?.patientSnapshot?.medications)
          ? transfer.patientSnapshot.medications.map(compactMedication)
          : [],
      }
      : null,
  };
}

function expandCompactTransferPayload(compact) {
  return {
    id: String(compact?.i || `TR-${Date.now()}`),
    patientId: String(compact?.pi || '').trim(),
    patientName: String(compact?.pn || '').trim(),
    direction: 'sent',
    conditionCategory: String(compact?.c || '').trim(),
    severity: String(compact?.s || '').trim(),
    diagnosis: String(compact?.dg || '').trim(),
    to: String(compact?.to || '').trim(),
    from: String(compact?.fr || '').trim(),
    status: String(compact?.st || 'Pending').trim(),
    createdAt: String(compact?.t || new Date().toISOString()).trim(),
    vitals: compact?.v || {},
    summary: String(compact?.sm || '').trim(),
    investigations: Array.isArray(compact?.inv) ? compact.inv : [],
    transferMode: String(compact?.tm || '').trim(),
    doctorName: String(compact?.dr || '').trim(),
    activeMeds: Array.isArray(compact?.m) ? compact.m.map(expandMedication) : [],
    shareId: String(compact?.sh || '').trim(),
    patientSnapshot: compact?.ps
      ? {
        id: String(compact?.ps?.id || '').trim(),
        name: String(compact?.ps?.n || '').trim(),
        abhaId: String(compact?.ps?.ai || '').trim(),
        abhaRegistration: Boolean(compact?.ps?.ar),
        age: Number(compact?.ps?.a || 0),
        sex: String(compact?.ps?.sx || '').trim(),
        bloodGroup: String(compact?.ps?.bg || '').trim(),
        phone: String(compact?.ps?.ph || '').trim(),
        allergies: Array.isArray(compact?.ps?.al) ? compact.ps.al : [],
        medications: Array.isArray(compact?.ps?.md)
          ? compact.ps.md.map(expandMedication)
          : [],
      }
      : null,
  };
}

export function buildTransferQrPayload(rawTransfer) {
  const transfer = rawTransfer?.patientName && rawTransfer?.id
    ? rawTransfer
    : mapTransferFromApi(rawTransfer);
  const compact = buildCompactTransferPayload(transfer);
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(compact));
  return `${QR_PREFIX}${compressed}`;
}

export function parseTransferQrPayload(payload) {
  try {
    const text = String(payload || '').trim();

    if (text.startsWith(QR_PREFIX)) {
      const encoded = text.slice(QR_PREFIX.length);
      const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
      if (!decompressed) return null;
      const compact = JSON.parse(decompressed);
      return expandCompactTransferPayload(compact);
    }

    const parsed = JSON.parse(text);
    if (parsed?.type === 'medirelay.transfer.v1' && parsed?.transfer && typeof parsed.transfer === 'object') {
      return mapTransferFromApi(parsed.transfer);
    }

    return null;
  } catch (_error) {
    return null;
  }
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
    doctorName: String(rawTransfer?.doctorName || '').trim(),
    activeMeds: Array.isArray(rawTransfer?.activeMedications)
      ? rawTransfer.activeMedications
      : [],
    shareId: String(rawTransfer?.shareId || ''),
    patientSnapshot: rawTransfer?.patient
      ? {
        id: String(rawTransfer?.patient?._id || rawTransfer?.patientId || ''),
        name: String(rawTransfer?.patient?.fullName || '').trim(),
        abhaId: String(rawTransfer?.patient?.abhaId || '').trim(),
        abhaRegistration: Boolean(rawTransfer?.patient?.abhaRegistration),
        age: Number(rawTransfer?.patient?.age || 0),
        sex: String(rawTransfer?.patient?.sex || '').trim(),
        bloodGroup: String(rawTransfer?.patient?.bloodGroup || '').trim(),
        phone: String(rawTransfer?.patient?.phone || '').trim(),
        allergies: Array.isArray(rawTransfer?.patient?.allergies) ? rawTransfer.patient.allergies : [],
        medications: Array.isArray(rawTransfer?.patient?.permanentMedications)
          ? rawTransfer.patient.permanentMedications.map((m) => ({
            name: String(m?.name || '').trim(),
            dose: String(m?.dose || '').trim(),
            route: String(m?.route || '').trim(),
            frequency: String(m?.frequency || '').trim(),
            mustNotStop: false,
          }))
          : [],
      }
      : null,
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
    qrPayload: String(body?.qrPayload || ''),
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

export async function getTransferByShareId(shareId) {
  const response = await fetch(`${TRANSFERS_ENDPOINT}/share/${shareId}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  const body = await getJsonOrThrow(response, 'Failed to fetch transfer');
  return mapTransferFromApi(body?.data);
}

export async function updateTransfer(transferId, patch) {
  const response = await fetch(`${TRANSFERS_ENDPOINT}/${transferId}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch || {}),
  });

  const body = await getJsonOrThrow(response, 'Failed to update transfer');
  return mapTransferFromApi(body?.data);
}
