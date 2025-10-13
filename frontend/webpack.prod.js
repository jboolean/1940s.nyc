const webpack = require('webpack');

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SentryWebpackPlugin = require('@sentry/webpack-plugin');

const path = require('path');

// Webpack configuration
module.exports = merge(common, {
  mode: 'production',
  output: {},
  optimization: {
    minimize: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      __DEV__: false,
      // Defined in Netlify config
      __API_BASE__: JSON.stringify(process.env.API_BASE),
      __STRIPE_PK__: JSON.stringify(process.env.STRIPE_PK),
      __RECAPTCHA_PK__: JSON.stringify(process.env.RECAPTCHA_PK),
      __DEPLOY_ENV__: JSON.stringify(process.env.CONTEXT),
      __GIT_SHA__: JSON.stringify(process.env.COMMIT_REF),
      __BRANCH__: JSON.stringify(process.env.BRANCH),
    }),
    new HtmlWebpackPlugin({
      template: path.join(path.resolve(__dirname, 'src'), 'app.html'),
      templateParameters: {
        optimizeContainerId: 'OPT-NVNC4KQ',
        gaId: 'UA-3445091-4',
        recaptchaSiteKey: process.env.RECAPTCHA_PK,
      },
    }),
    new SentryWebpackPlugin({
      org: 'julian-boilen',
      project: 'fourtiesnyc-frontend',

      // Specify the directory containing build artifacts
      include: path.resolve(__dirname, 'dist'),

      // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
      // and needs the `project:releases` and `org:read` scopes
      authToken: process.env.SENTRY_AUTH_TOKEN,

      // Optionally uncomment the line below to override automatic release name detection
      // release: process.env.RELEASE,
    }),
  ],
});
