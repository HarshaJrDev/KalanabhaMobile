/**
 * Base URL for the Kalanabha NestJS backend (see kalanabhaBackend/src/main.ts
 * and .env: API_PREFIX=api/v1).
 *
 * Pointed at the live Render deployment for release builds — a packaged
 * APK has no dev machine to reach at localhost/10.0.2.2, so this must be a
 * real, publicly reachable origin. Swap back to the local dev block below
 * when running against a local backend again.
 */
export const API_BASE_URL = 'https://kalanabhabackend-2v0l.onrender.com/api/v1';

// --- Local dev (uncomment to use against `npm run start:dev`) ---
// import { Platform } from 'react-native';
// const DEV_HOST = Platform.select({ android: '10.0.2.2', default: 'localhost' });
// export const API_BASE_URL = `http://${DEV_HOST}:3000/api/v1`;
