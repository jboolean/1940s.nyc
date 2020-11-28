import history from './history';

const activateGoogleOptimize = (): void => {
  // This event is necessary b/c Optimize only allows activating on a single event, and GTM
  // has 2 different events for page view and route change (b/c we have an SPA). If Optimize
  // changes in the future to allow an OR in it's activation logic, then we can remove this function.
  // This setTimeout is necessary so the page can draw first before Optimize can read/alter DOM.
  setTimeout(() => {
    console.debug('optimize.activate');
    window.dataLayer.push({ event: 'optimize.activate' });
  }, 0);
};

/**
 * Activates Optimize on route changes.
 */
function listenToHistory(): void {
  history.listen(() => {
    activateGoogleOptimize();
  });
}

activateGoogleOptimize();
listenToHistory();

export { activateGoogleOptimize };
