import { WHCC_BASE_URL } from './createClientConfig';
import type { CreateClientConfig } from './fulfillmentClient/client.gen';

// No /api in the base URL: the fulfillment spec's paths already include it.
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseURL: new URL(WHCC_BASE_URL).origin,
  headers: { 'WHCC-API-Version': '2026-10' },
});
