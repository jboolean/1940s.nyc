import addMerchItemsToOrderImpl from './src/cron/addMerchItemsToOrder';
import renderMerchPrintfilesImpl from './src/cron/renderMerchPrintfiles';
import {
  submitPendingOrders,
  syncSubmittedOrders,
} from './src/cron/submitOrders';

import withSetup from './withSetup';

// Each step is independent, so one failing does not stop the others.
async function runStep(name: string, step: () => Promise<void>): Promise<void> {
  try {
    await step();
  } catch (e) {
    console.error(`[merch] ${name} failed`, e);
  }
}

export const handler = withSetup(async () => {
  // Quick steps first, so slow rendering can never keep them from running.
  await runStep('submit orders', submitPendingOrders);
  await runStep('sync submitted orders', syncSubmittedOrders);
  await runStep('render printfiles', renderMerchPrintfilesImpl);
  await runStep('add items to orders', addMerchItemsToOrderImpl);
});
