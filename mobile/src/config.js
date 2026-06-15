import Constants from 'expo-constants';

// The backend port (server/.env -> PORT).
const PORT = 4000;

// Optional manual override. Set this if auto-detection fails — e.g. testing on a
// device that's on a different network than your computer.
//   Example: const MANUAL_API_URL = 'http://192.168.1.42:4000';
const MANUAL_API_URL = '';

/**
 * A phone (or emulator) cannot reach your computer's "localhost". Expo already
 * serves the JS bundle from your computer's LAN address, so we reuse that host
 * for the API — no hardcoded IP needed when running in Expo Go on the same Wi-Fi.
 */
function autoHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    '';
  return hostUri.split(':')[0] || 'localhost';
}

export const API_URL = MANUAL_API_URL || `http://${autoHost()}:${PORT}`;
