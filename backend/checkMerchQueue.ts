import checkMerchQueueImpl from './src/cron/checkMerchQueue';
import withSetup from './withSetup';

export const handler = withSetup(checkMerchQueueImpl);
