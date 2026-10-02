import { DEV_HOST } from './devHost.generated';

/**
 * Base URL for the Kalanabha NestJS backend (see kalanabhaBackend/src/main.ts
 * and .env: API_PREFIX=api/v1).
 *
 * Switches automatically on RN's own `__DEV__` flag — true whenever the app
 * is running through Metro (`npm run android`/`ios` against
 * `kalanabhaBackend`'s `npm run dev`), false in a release/production build.
 *
 * DEV_HOST comes from devHost.generated.ts, written fresh by
 * scripts/write-dev-host.js on every `npm run android`/`ios`/`start` (see
 * package.json's "pre*" hooks) — it reads this machine's current LAN IP
 * via Node's os.networkInterfaces() at build time and bakes it into the
 * bundle. No manual IP updates, ever, even across WiFi reconnects, and it
 * works for a physical device AND an emulator/simulator since the LAN IP
 * is reachable from both.
 *
 * (An earlier version tried detecting this at runtime from
 * NativeModules.SourceCode.scriptURL — that returns undefined under the
 * New Architecture/Fabric-Bridgeless, which silently broke on-device
 * networking. Build-time generation sidesteps that entirely.)
 */
const LOCAL_API_BASE_URL = `http://${DEV_HOST}:3000/api/v1`;
const PROD_API_BASE_URL = 'https://api.kalanabhalogistics.com/api/v1';

export const API_BASE_URL = __DEV__ ? LOCAL_API_BASE_URL : PROD_API_BASE_URL;
