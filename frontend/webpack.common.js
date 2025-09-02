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
    assetModuleFilename: '[name]-[hash][ext]',
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
    }),
    new webpack.IgnorePlugin({ resourceRegExp: /^\.\/locale$/ }),
    new CopyPlugin({
      patterns: [{ from: '_redirects' }, { from: 'terms.html' }],
    }),
    new ESLintPlugin({ fix: true, exclude: ['node_modules', '.yalc'] }),
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules|.yalc/,
        use: ['babel-loader'],
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules|.yalc/,
        loader: 'ts-loader',
      },
      {
        test: /\.(css|less)$/,
        exclude: /node_modules/,
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
        test: /\.css$/,
        include: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: false,
              importLoaders: 1,
            },
          },
          'postcss-loader',
        ],
      },
      {
        test: /\.(png|jpg|gif|svg|style\.json)$/,
        type: 'asset/resource',
      },
      {
        test: /\.svg$/,
        issuer: /\.(j|t)sx$/,
        exclude: /node_modules|.yalc/,
        loader: 'svg-react-loader',
        resourceQuery: { not: [/asset/] },
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
