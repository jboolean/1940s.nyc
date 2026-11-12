import required from '../../business/utils/required';
import type { CreateClientConfig } from './client/client.gen';

// Sandbox host. The production host is not configured.
export const WHCC_BASE_URL = 'https://apis-stage.whcc.com/api';

// Read per request, so stages without WHCC still load.
export function getAuthorizationHeader(): string {
  return `Bearer ${required(process.env.WHCC_SK || undefined, 'WHCC_SK')}`;
}

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseURL: WHCC_BASE_URL,
  headers: { 'WHCC-API-Version': '2026-10' },
});
