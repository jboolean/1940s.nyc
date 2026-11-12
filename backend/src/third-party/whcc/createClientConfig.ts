import required from '../../business/utils/required';
import type { CreateClientConfig } from './client/client.gen';

// The only host that may appear in code. The production host is not configured.
export const WHCC_BASE_URL = 'https://apis-stage.whcc.com/api';

// Read when a request is sent, not at import, so a stage without WHCC set up still loads.
export function getAuthorizationHeader(): string {
  return `Bearer ${required(process.env.WHCC_SK, 'WHCC_SK')}`;
}

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseURL: WHCC_BASE_URL,
  headers: { 'WHCC-API-Version': '2026-10' },
});
