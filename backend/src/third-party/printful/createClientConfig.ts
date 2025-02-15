import required from '../../business/utils/required';
import type { CreateClientConfig } from './client/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  headers: {
    Authorization: `Bearer ${required(process.env.PRINTFUL_SK, 'PRINTFUL_SK')}`,
  },
});
