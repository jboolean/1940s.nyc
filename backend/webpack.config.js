/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
const nodeExternals = require('webpack-node-externals');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  target: 'node',
  entry: {
    appHandler: './appHandler.ts',
    convertImage: './convertImage.ts',
    checkStaleStories: './checkStaleStories.ts',
    checkMerchQueue: './checkMerchQueue.ts',
    syncMap: './syncMap.ts',
    syncMapSelfHosted: './syncMapSelfHosted.ts',
    generateStoryTitles: './generateStoryTitles.ts',
    sendEmailCampaigns: './sendEmailCampaigns.ts',
    renderMerchPrintfiles: './renderMerchPrintfiles.ts',
    registerPrintfulWebhooks: './registerPrintfulWebhooks.ts',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: [
    nodeExternals({
      // Exclude large dependencies that should not be bundled
      allowlist: [],
    }),
    'sharp',
    'puppeteer-core',
    '@sparticuz/chromium',
    'aws-sdk',
    /^@aws-sdk\//,
    /^@swc\//,
    'typescript',
    'ts-loader',
    'webpack',
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: false,
            compilerOptions: {
              emitDecoratorMetadata: true,
              experimentalDecorators: true,
            },
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: isProduction,
    // Prevent webpack from optimizing away reflect-metadata
    sideEffects: false,
  },
  devtool: isProduction ? 'source-map' : 'eval-source-map',
};
