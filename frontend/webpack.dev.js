const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

// Webpack configuration
module.exports = merge(common, {
  mode: 'development',
  entry: ['react-hot-loader/patch'],
  devtool: 'inline-source-map',
  optimization: {
    moduleIds: 'named',
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: true,
      __API_BASE__: JSON.stringify("http://dev.1940s.nyc:3000")
    }),
    new HtmlWebpackPlugin({
      template: path.join(path.resolve(__dirname, 'src'), 'app.html'),
      templateParameters: {
        optimizeContainerId: 'OPT-TZ3GCK2',
        gaId: 'UA-3445091-4',
      },
    }),
  ],

  devServer: {
    historyApiFallback: true,
    host: 'dev.1940s.nyc',
  },
});
