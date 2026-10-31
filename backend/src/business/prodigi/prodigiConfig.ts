import type { Environment } from 'prodigi-print-api';

const SANDBOX_HOST = 'api.sandbox.prodigi.com';
const PRODUCTION_HOST = 'api.prodigi.com';

// SSM stores the base URL as a bare host ("api.sandbox.prodigi.com"), but accept a full URL too.
export function prodigiEnvironmentFromBaseUrl(baseUrl: string): Environment {
  const trimmed = baseUrl.trim();
  const host = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
    .hostname;
  switch (host) {
    case SANDBOX_HOST:
      return 'sandbox';
    case PRODUCTION_HOST:
      return 'production';
    default:
      throw new Error(`Unrecognized Prodigi base URL host: ${host}`);
  }
}

// Orders on the production API cost real money. They are only allowed against the sandbox, or when
// PRODIGI_LIVE_ORDERS_ENABLED=true is set explicitly (it is not set in any environment by default).
export function assertOrderCreationAllowed(
  baseUrl: string,
  liveOrdersEnabled: string | undefined
): void {
  if (prodigiEnvironmentFromBaseUrl(baseUrl) === 'sandbox') {
    return;
  }
  if (liveOrdersEnabled !== 'true') {
    throw new Error(
      'Refusing to create a Prodigi order against the live API. Set PRODIGI_LIVE_ORDERS_ENABLED=true to allow it.'
    );
  }
}
