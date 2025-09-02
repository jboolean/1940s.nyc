/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'production',
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
    modules: ['node_modules', path.resolve(__dirname, 'src')],
  },
  externals: [
    nodeExternals({
      // Include sharp and AWS SDK as externals since they're provided by Lambda runtime
      allowlist: [],
    }),
    // Explicitly exclude packages provided by Lambda runtime
    'sharp',
    /^@aws-sdk\//,
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: false,
              configFile: path.resolve(__dirname, 'tsconfig.json'),
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, '.webpack'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  optimization: {
    // Enable minification for production, disable for development
    minimize: process.env.NODE_ENV === 'production',
  },
  devtool:
    process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',
};
