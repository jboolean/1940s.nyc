import addMerchItemsToOrderImpl from './src/cron/addMerchItemsToOrder';
import renderMerchPrintfilesImpl from './src/cron/renderMerchPrintfiles';
import renderPrintfilesImpl from './src/cron/renderPrintfiles';
import {
  submitPendingProdigiOrders,
  syncSubmittedProdigiOrders,
} from './src/cron/submitProdigiOrders';

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
  await runStep('render tote printfiles', renderMerchPrintfilesImpl);
  await runStep('render print files', renderPrintfilesImpl);
  await runStep('add items to orders', addMerchItemsToOrderImpl);
  await runStep('submit Prodigi orders', submitPendingProdigiOrders);
  await runStep('sync Prodigi orders', syncSubmittedProdigiOrders);
});
