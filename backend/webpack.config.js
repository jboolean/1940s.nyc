/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
      // Bundle all production dependencies, only externalize devDependencies
      modulesFromFile: {
        include: ['devDependencies'],
      },
    }),
    // Explicitly externalize problematic devDependencies
    '@tsoa/cli',
    'typescript',
    'eslint',
    'webpack',
    // Only externalize the packages that cause problems in Lambda
    'sharp',
    'puppeteer-core',
    '@sparticuz/chromium',
    'aws-sdk',
    /^@aws-sdk\//,
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
  devtool: isProduction ? false : 'eval-source-map',
  ignoreWarnings: [
    // Suppress TypeORM driver warnings for unused drivers
    /mongodb/,
    /mssql/,
    /mysql/,
    /mysql2/,
    /oracledb/,
    /pg/,
    /pg-native/,
    /pg-query-stream/,
    /react-native-sqlite-storage/,
    /redis/,
    /sqlite3/,
    /sql.js/,
    /typeorm-aurora-data-api-driver/,
    /@google-cloud\/spanner/,
    /@sap\/hana-client/,
    /better-sqlite3/,
    /ioredis/,
    // Suppress other common warnings
    /Critical dependency: the request of a dependency is an expression/,
    /Module not found: Error: Can't resolve/,
  ],
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'certs',
          to: 'certs',
        },
      ],
    }),
  ],
  stats: {
    assets: true,
    modules: true,
    chunks: true,
  },
};
