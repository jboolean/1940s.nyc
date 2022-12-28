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
      __API_BASE__: JSON.stringify("http://dev.1940s.nyc:3000"),
      __STRIPE_PK__: JSON.stringify("pk_test_51HHaB6FCLBtNZLVl2eku10yXOnLMuYmiXDmK2iMo562DrZePotrkn49Acj7AINohiWzuUrgIp4OUDPRkbuvolmPo00x1AHBQLy")
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
