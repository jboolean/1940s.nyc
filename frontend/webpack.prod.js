const webpack = require('webpack');

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
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
      __STRIPE_PK__: JSON.stringify(process.env.STRIPE_PK)
    }),
    new HtmlWebpackPlugin({
      template: path.join(path.resolve(__dirname, 'src'), 'app.html'),
      templateParameters: {
        optimizeContainerId: 'OPT-NVNC4KQ',
        gaId: 'UA-3445091-4',
      },
    }),
  ],
});
