const webpack = require('webpack');

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

// Webpack configuration
module.exports = merge(common, {
  output: {
    // publicPath: '//takomaradio.org/s/'
  },
  plugins: [
    new UglifyJSPlugin({
      sourceMap: true,
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      __DEV__: false,
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
