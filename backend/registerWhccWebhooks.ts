import registerWhccWebhooks from './src/business/whcc/registerWhccWebhooks';
import withSetup from './withSetup';

export const handler = withSetup(registerWhccWebhooks);
