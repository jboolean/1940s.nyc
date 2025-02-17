import registerPrintfulWebhooks from './src/business/merch/registerWebhooks';
import withSetup from './withSetup';

export const handler = withSetup(registerPrintfulWebhooks);
