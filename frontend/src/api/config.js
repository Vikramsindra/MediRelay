import { Platform } from 'react-native';

// For Android emulator use 10.0.2.2 instead of localhost.
const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = `http://${host}:8080`;

export const API_PATHS = {
  test: '/test',
  patients: '/api/v1/patients',
  patientSearch: '/api/v1/patients/search',
  transfers: '/api/v1/transfers',
};

export function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}
