// We are using node's native package 'path'
// https://nodejs.org/api/path.html
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

// Constant with our paths
const paths = {
  DIST: path.resolve(__dirname, 'dist'),
  SRC: path.resolve(__dirname, 'src'),
};

// Webpack configuration
module.exports = {
  entry: [path.join(paths.SRC, 'index.ts')],
  output: {
    path: paths.DIST,
    filename: 'app.bundle.js',
    publicPath: '/',
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
    }),
    new webpack.IgnorePlugin({ resourceRegExp: /^\.\/locale$/ }),
    new CopyPlugin({
      patterns: [{ from: '_redirects' }],
    }),
    new ESLintPlugin({ fix: true }),
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
      },
      {
        test: /\.(css|less)$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]-[local]-[contenthash:base64:5]',
              },
              importLoaders: 2,
            },
          },
          'postcss-loader',
          'less-loader',
        ],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name]-[contenthash:base64:5].[ext]',
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        issuer: /\.(j|t)sx$/,
        exclude: /node_modules/,
        loader: 'svg-react-loader',
        options: {
          classIdPrefix: '[name]-[contenthash:8]__',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    // directories named 'shared' will be resolved by lower modules, without ../../../.
    modules: ['node_modules', 'shared', path.resolve(__dirname, './src')],
    alias: {
      // modernizr$: path.resolve(__dirname, './.modernizrrc'),
      modernizr$: path.resolve(__dirname, './Modernizr.js'),
    },
  },
};
