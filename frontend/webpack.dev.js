const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const RECAPTCHA_SITE_KEY_DEV = '6LeEBLwjAAAAAOrrSxVM9Oac2rlC0uRGkmvx2m0p';

// Webpack configuration
module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  optimization: {
    moduleIds: 'named',
  },
  cache: false,
  plugins: [
    new ReactRefreshPlugin(),
    new webpack.DefinePlugin({
      __DEV__: true,
      __API_BASE__: JSON.stringify('http://dev.1940s.nyc:3000'),
      __STRIPE_PK__: JSON.stringify(
        'pk_test_51HHaB6FCLBtNZLVl2eku10yXOnLMuYmiXDmK2iMo562DrZePotrkn49Acj7AINohiWzuUrgIp4OUDPRkbuvolmPo00x1AHBQLy'
      ),
      __RECAPTCHA_PK__: JSON.stringify(RECAPTCHA_SITE_KEY_DEV),
      __DEPLOY_ENV__: JSON.stringify('dev'),
      __GIT_SHA__: JSON.stringify('dev'),
      __BRANCH__: JSON.stringify('dev'),
    }),
    new HtmlWebpackPlugin({
      template: path.join(path.resolve(__dirname, 'src'), 'app.html'),
      templateParameters: {
        optimizeContainerId: 'OPT-TZ3GCK2',
        gaId: 'UA-3445091-4',
        recaptchaSiteKey: RECAPTCHA_SITE_KEY_DEV,
      },
    }),
  ],

  devServer: {
    historyApiFallback: true,
    host: 'dev.1940s.nyc',
    hot: true,
  },
});
