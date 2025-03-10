import syncMapImpl from './src/cron/syncMap';

// Importing @sentry/tracing patches the global hub for tracing to work.
import '@sentry/tracing';
import withSetup from './withSetup';

export const handler = withSetup(syncMapImpl);
