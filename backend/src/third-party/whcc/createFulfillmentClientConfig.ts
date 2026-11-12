import { WHCC_BASE_URL } from './createClientConfig';
import type { CreateClientConfig } from './fulfillmentClient/client.gen';

// The fulfillment spec's paths already start with /api.
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseURL: new URL(WHCC_BASE_URL).origin,
  headers: { 'WHCC-API-Version': '2026-10' },
});
