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
  if (normalized === 'viewed') return 'Viewed';
  if (normalized === 'submitted') return 'Pending';
  if (normalized === 'draft') return 'Pending';
  if (normalized === 'pending') return 'Pending';
  return 'Pending';
}

function normalizeVitals(sourceVitals = {}) {
  const source = sourceVitals && typeof sourceVitals === 'object' ? sourceVitals : {};
  const toVitalValue = (value) => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'number') return Number.isFinite(value) ? value : '';
    const text = String(value).trim();
    if (!text) return '';
    const normalized = text.replace(',', '.');
    const direct = Number(normalized);
    if (Number.isFinite(direct)) return direct;
    const match = normalized.match(/-?\d+(?:\.\d+)?/);
    if (!match) return text;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : text;
  };

  const bpText = String(source.bp || '').trim();
  const bpSys = String(source.bpSys || source.systolic || '').trim();
  const bpDia = String(source.bpDia || source.diastolic || '').trim();
  const bpFromParts = bpSys && bpDia ? `${bpSys}/${bpDia}` : '';
  const bpRaw = bpText || bpFromParts;
  const [rawSys, rawDia] = bpRaw.includes('/') ? bpRaw.split('/') : ['', ''];

  return {
    bpSys: String(rawSys || bpSys).trim(),
    bpDia: String(rawDia || bpDia).trim(),
    hr: toVitalValue(source.hr ?? source.heartRate),
    spo2: toVitalValue(source.spo2 ?? source.oxygenSat ?? source.oxygenSaturation),
    temp: toVitalValue(source.temp ?? source.temperature),
    rr: toVitalValue(source.rr ?? source.respiratoryRate ?? source.respRate),
    gcs: toVitalValue(source.gcs),
    bsl: toVitalValue(source.bloodSugar ?? source.bsl ?? source.glucose),
  };
}

function normalizePatientSnapshot(rawTransfer) {
  const snapshot = rawTransfer?.patientSnapshot || {};
  const patient = rawTransfer?.patient || {};

  const mapped = {
    id: String(
      patient?._id
      || patient?.id
      || snapshot?.id
      || rawTransfer?.patientId
      || '',
    ).trim(),
    name: String(
      patient?.fullName
      || patient?.name
      || snapshot?.name
      || rawTransfer?.patientName
      || '',
    ).trim(),
    abhaId: String(patient?.abhaId || snapshot?.abhaId || '').trim(),
    abhaRegistration: Boolean(patient?.abhaRegistration ?? snapshot?.abhaRegistration),
    age: Number(patient?.age ?? snapshot?.age ?? 0),
    sex: String(patient?.sex || snapshot?.sex || '').trim(),
    bloodGroup: String(patient?.bloodGroup || snapshot?.bloodGroup || '').trim(),
    phone: String(patient?.phone || snapshot?.phone || '').trim(),
    allergies: Array.isArray(patient?.allergies)
      ? patient.allergies
      : (Array.isArray(snapshot?.allergies) ? snapshot.allergies : []),
    medications: Array.isArray(patient?.permanentMedications)
      ? patient.permanentMedications.map((m) => ({
        name: String(m?.name || '').trim(),
        dose: String(m?.dose || '').trim(),
        route: String(m?.route || '').trim(),
        frequency: String(m?.frequency || '').trim(),
        mustNotStop: Boolean(m?.mustNotStop),
      }))
      : (Array.isArray(snapshot?.medications) ? snapshot.medications : []),
  };

  const hasSnapshotData = Boolean(
    mapped.id
    || mapped.name
    || mapped.abhaId
    || mapped.age
    || mapped.sex
    || mapped.bloodGroup
    || mapped.phone
    || mapped.allergies.length
    || mapped.medications.length,
  );

  return hasSnapshotData ? mapped : null;
}

export function mapTransferFromApi(rawTransfer) {
  const patientSnapshot = normalizePatientSnapshot(rawTransfer || {});
  const patientName = String(
    patientSnapshot?.name
    || rawTransfer?.patientName
    || rawTransfer?.patient?.fullName
    || '',
  ).trim();
  const rawPatientId = rawTransfer?.patientId;
  const patientId = String(
    typeof rawPatientId === 'object' && rawPatientId !== null
      ? (rawPatientId?._id || rawPatientId?.id || '')
      : (rawPatientId || rawTransfer?.patient?._id || patientSnapshot?.id || ''),
  ).trim();
  const createdAt = rawTransfer?.createdAt || rawTransfer?.timestamp || new Date().toISOString();
  const vitals = normalizeVitals(rawTransfer?.vitals || {});

  return {
    id: String(rawTransfer?._id || rawTransfer?.id || `TR-${Date.now()}`),
    patientId,
    patientName,
    direction: 'sent',
    conditionCategory: String(rawTransfer?.conditionCategory || '').trim(),
    severity: String(rawTransfer?.severity || '').trim(),
    diagnosis: String(rawTransfer?.chiefComplaint || rawTransfer?.diagnosis || '').trim(),
    to: String(rawTransfer?.receivingHospital || rawTransfer?.to || '').trim(),
    from: String(rawTransfer?.sendingHospital || rawTransfer?.from || '').trim(),
    status: mapTransferStatus(rawTransfer?.status),
    createdAt,
    vitals,
    summary: String(rawTransfer?.clinicalSummary || rawTransfer?.summary || '').trim(),
    investigations: Array.isArray(rawTransfer?.pendingInvestigations)
      ? rawTransfer.pendingInvestigations
      : (Array.isArray(rawTransfer?.investigations) ? rawTransfer.investigations : []),
    transferMode: String(rawTransfer?.modeOfTransfer || rawTransfer?.transferMode || '').trim(),
    doctorName: String(rawTransfer?.doctorName || '').trim(),
    activeMeds: Array.isArray(rawTransfer?.activeMedications)
      ? rawTransfer.activeMedications
      : (Array.isArray(rawTransfer?.activeMeds) ? rawTransfer.activeMeds : []),
    shareId: String(rawTransfer?.shareId || ''),
    patientSnapshot,
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
