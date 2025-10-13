import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import netlifyIdentity from 'netlify-identity-widget';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Modal from 'react-modal';

import 'core-js/stable';
import 'normalize.css';
import 'utils/initMaplibre';
// import 'modernizr';

import App from './screens/App';

import './app.less';

Sentry.init({
  dsn: 'https://2dfcb48f8ebe4f358010dcb1d1e195b2@o4504630310600704.ingest.sentry.io/4504630382690304',
  integrations: [new BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

import './datadog';

const containerEl = document.getElementById('app-container');

window.netlifyIdentity = netlifyIdentity;
netlifyIdentity.init({});

Modal.setAppElement(containerEl);

const root = createRoot(containerEl);

root.render(React.createElement(App));
