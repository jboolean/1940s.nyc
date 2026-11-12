import { defineConfig, type UserConfig } from '@hey-api/openapi-ts';
import path from 'path';

const plugins = (runtimeConfigPath: string): UserConfig['plugins'] => [
  { name: '@hey-api/client-axios' as const, runtimeConfigPath },
  { name: '@hey-api/sdk' as const, asClass: false },
];

// Commerce and fulfillment are separate specs, each generated into its own directory.
export default defineConfig([
  {
    input: path.join(__dirname, 'openapi.json'),
    output: { path: path.join(__dirname, 'client') },
    plugins: plugins('./createClientConfig'),
  },
  {
    input: path.join(__dirname, 'fulfillment.yaml'),
    output: { path: path.join(__dirname, 'fulfillmentClient') },
    plugins: plugins('./createFulfillmentClientConfig'),
  },
]);
