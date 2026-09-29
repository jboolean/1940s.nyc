/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: 'dfabd184-b8ed-47db-90bc-2a4c26828b72',
  clientToken: 'pub2b91b53e324deaa20ce2c3738fc4f9aa',
  site: 'datadoghq.com',
  service: 'fourtiesnyc',
  env: __DEPLOY_ENV__ || 'dev',
  version: __GIT_SHA__,
  // Explicitly enable manual view tracking for RRv5
  trackViewsManually: true,
  defaultPrivacyLevel: 'mask-user-input',
  // plugins: [reactPlugin({ router: false })], // Keep disabled until upgrading React Router due to deps conflict
});
datadogRum.setGlobalContextProperty('branch', __BRANCH__);
