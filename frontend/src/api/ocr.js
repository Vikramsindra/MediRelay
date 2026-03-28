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
const OCR_ENDPOINT = `${API_BASE_URL}/api/v1/ocr/extract`;

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (_error) {
    return {};
  }
}

export async function extractTransferDetailsFromImage(imageAsset) {
  if (!imageAsset?.uri) {
    throw new Error('Image is required for extraction');
  }

  const formData = new FormData();
  formData.append('image', {
    uri: imageAsset.uri,
    name: imageAsset.fileName || `transfer-${Date.now()}.jpg`,
    type: imageAsset.mimeType || 'image/jpeg',
  });

  const response = await fetch(OCR_ENDPOINT, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  });

  const body = await parseJsonSafe(response);
  if (!response.ok || !body?.success) {
    throw new Error(body?.message || 'Failed to extract details from image');
  }

  return {
    rawText: String(body?.data?.rawText || ''),
    parsed: body?.data?.parsed && typeof body.data.parsed === 'object' ? body.data.parsed : {},
  };
}
