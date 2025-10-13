/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: 'dfabd184-b8ed-47db-90bc-2a4c26828b72',
  clientToken: 'pub2b91b53e324deaa20ce2c3738fc4f9aa',
  site: 'datadoghq.com',
  service: 'fourtiesnyc',
  env: __DEV__ ? 'dev' : 'prod',
  // Explicitly enable manual view tracking for RRv5
  trackViewsManually: true,
  defaultPrivacyLevel: 'mask-user-input',
  // plugins: [reactPlugin({ router: false })], // Keep disabled until upgrading React Router due to deps conflict
});

// --- Datadog RUM manual SPA view tracking for React Router v5 ---
function currentPath(): string {
  return (
    window.location.pathname + window.location.search + window.location.hash
  );
}

// Start the initial view
datadogRum.startView({ name: currentPath() });

// Patch pushState and replaceState to detect programmatic navigations
(function patchHistoryForRum() {
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    const ret = originalPushState.apply(this, args as any);
    // Defer to allow location to update
    queueMicrotask(() => datadogRum.startView({ name: currentPath() }));
    return ret;
  } as typeof history.pushState;

  history.replaceState = function (...args) {
    const ret = originalReplaceState.apply(this, args as any);
    queueMicrotask(() => datadogRum.startView({ name: currentPath() }));
    return ret;
  } as typeof history.replaceState;

  // Back/forward buttons
  window.addEventListener('popstate', () => {
    datadogRum.startView({ name: currentPath() });
  });
})();
// --- End Datadog RUM manual SPA view tracking ---
