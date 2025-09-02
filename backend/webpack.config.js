/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
const nodeExternals = require('webpack-node-externals');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

// Check multiple environment indicators for production mode
const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.SLS_STAGE === 'production' ||
  process.env.SLS_STAGE === 'staging';

// Enable bundle analysis when ANALYZE_BUNDLE is set
const shouldAnalyze = process.env.ANALYZE_BUNDLE === 'true';

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
    /^@tsoa\//,
    'tsoa',
    'typescript',
    'ts-loader',
    'ts-node',
    'webpack',
    'eslint',
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
  plugins: [
    ...(shouldAnalyze
      ? [
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: 'bundle-report.html',
            openAnalyzer: false,
            generateStatsFile: true,
            statsFilename: 'bundle-stats.json',
          }),
        ]
      : []),
  ],
  stats: {
    assets: true,
    modules: true,
    chunks: true,
    reasons: shouldAnalyze,
    usedExports: shouldAnalyze,
    providedExports: shouldAnalyze,
  },
};
