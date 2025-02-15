import { defineConfig } from '@hey-api/openapi-ts';
import path from 'path';

export default defineConfig({
  input: path.join(__dirname, 'openapi.json'),
  output: { path: path.join(__dirname, 'client'), lint: 'eslint' },
  plugins: [
    {
      name: '@hey-api/client-axios',
      bundle: false,
      runtimeConfigPath: './createClientConfig.ts',
    },
    { name: '@hey-api/sdk', asClass: false },
  ],
  name: 'PrintfulClient',
});
