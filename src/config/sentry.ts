import * as Sentry from '@sentry/react-native';

// A Sentry DSN is meant to be public/client-bundled (unlike an API key) —
// Sentry's own docs confirm this; it only identifies which project events
// go to, it can't be used to read your data. Safe to hardcode here, same
// as this app already hardcodes its production API URL in config/env.ts.
const SENTRY_DSN =
  'https://06e5960e80445c5eff8e2d7ce56e7089@o4512189329309696.ingest.us.sentry.io/4512189339205632';

// Exported so App.tsx can register the NavigationContainer with it once
// mounted — adds "which screen was the user on" breadcrumbs to every
// crash report, not just the bare stack trace.
export const navigationIntegration = Sentry.reactNavigationIntegration();

export const initSentry = () => {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    integrations: [navigationIntegration],
    // Sends IP address + any Sentry.setUser() data with every event —
    // genuinely useful for debugging ("which customer hit this"), but
    // worth knowing this app has real phone numbers/addresses in its
    // user records, so that's real PII landing in Sentry's project
    // too. Fine for now; revisit if this needs to stay out of a
    // third-party tool for compliance reasons later.
    sendDefaultPii: true,
    // Dev builds hit this constantly during normal iteration (hot
    // reload errors, etc.) — only report from release builds so the
    // project isn't flooded with noise that was never a real crash.
    enabled: !__DEV__,
  });
};
