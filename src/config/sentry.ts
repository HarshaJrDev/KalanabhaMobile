import * as Sentry from '@sentry/react-native';





const SENTRY_DSN =
  'https://06e5960e80445c5eff8e2d7ce56e7089@o4512189329309696.ingest.us.sentry.io/4512189339205632';




export const navigationIntegration = Sentry.reactNavigationIntegration();

export const initSentry = () => {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    integrations: [navigationIntegration],
    
    
    
    
    
    
    sendDefaultPii: true,
    
    
    
    enabled: !__DEV__,
  });
};
