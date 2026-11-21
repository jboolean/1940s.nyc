import isProduction from '../../business/utils/isProduction';
import required from '../../business/utils/required';
import type { CreateClientConfig } from './client/client.gen';

export const WHCC_LIVE_BASE_URL = 'https://apis.whcc.com/api';
export const WHCC_SANDBOX_BASE_URL = 'https://apis-stage.whcc.com/api';

export function getWhccBaseUrl(): string {
  return isProduction() ? WHCC_LIVE_BASE_URL : WHCC_SANDBOX_BASE_URL;
}

// Read per request, so stages without WHCC still load.
export function getAuthorizationHeader(): string {
  return `Bearer ${required(process.env.WHCC_SK || undefined, 'WHCC_SK')}`;
}

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseURL: getWhccBaseUrl(),
  headers: { 'WHCC-API-Version': '2026-10' },
});
