const esbuildPluginTsc = require('esbuild-plugin-tsc');

module.exports = [
  esbuildPluginTsc({
    // Use the existing tsconfig.json
    tsconfigPath: './tsconfig.json',
    // Only compile files that actually need decorator metadata
    force: false,
    // Enable tsx support if needed
    tsx: false,
  }),
];
