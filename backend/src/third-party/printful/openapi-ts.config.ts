import { defineConfig } from '@hey-api/openapi-ts';
import path from 'path';

export default defineConfig({
  input: path.join(__dirname, 'openapi.json'),
  output: { path: path.join(__dirname, 'client') },
  plugins: [
    {
      name: '@hey-api/client-axios',
      runtimeConfigPath: './createClientConfig',
    },
    { name: '@hey-api/sdk', asClass: false },
  ],
});
