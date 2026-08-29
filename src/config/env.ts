import { Platform } from 'react-native';

/**
 * Base URL for the Kalanabha NestJS backend (see kalanabhaBackend/src/main.ts
 * and .env: PORT=3000, API_PREFIX=api/v1).
 *
 * `10.0.2.2` is the Android emulator's alias for the host machine's
 * `localhost` — plain `localhost` inside the emulator refers to the
 * emulator itself, not the dev machine running the API.
 */
const DEV_HOST = Platform.select({ android: '10.0.2.2', default: 'localhost' });

export const API_BASE_URL = `http://${DEV_HOST}:3000/api/v1`;
