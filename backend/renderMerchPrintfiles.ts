import addMerchItemsToOrderImpl from './src/cron/addMerchItemsToOrder';
import renderMerchPrintfilesImpl from './src/cron/renderMerchPrintfiles';

import withSetup from './withSetup';

export const handler = withSetup(async () => {
  await renderMerchPrintfilesImpl();
  await addMerchItemsToOrderImpl();
});
