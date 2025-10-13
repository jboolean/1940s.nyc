/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { datadogRum } from '@datadog/browser-rum';

// --- Datadog RUM + React Router v5 wiring (no monkeypatching) ---
import type { Location } from 'history';

function pathFromLocation(
  loc: Location | { pathname: string; search?: string; hash?: string }
): string {
  const search = loc.search ?? '';
  const hash = loc.hash ?? '';
  return `${loc.pathname}${search}${hash}`;
}

/**
 * Call this once, right after you create your app's history and before rendering the <Router>.
 * Example:
 *   // history.ts
 *   export const history = createBrowserHistory();
 *
 *   // index.tsx
 *   import { history } from './history';
 *   import { attachRumToHistory } from './datadog';
 *   attachRumToHistory(history);
 */
export function attachRumToHistory(history: {
  location: Location;
  listen: (cb: (loc: Location) => void) => void;
}): void {
  // Start initial view
  datadogRum.startView({ name: pathFromLocation(history.location) });
  // Track subsequent route changes
  history.listen((location) => {
    datadogRum.startView({ name: pathFromLocation(location) });
  });
}
// --- End Datadog RUM + React Router v5 wiring ---

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
