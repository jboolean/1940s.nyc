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
      patterns: [
        { from: '_redirects' },
        { from: 'terms.html' },
        // Loaded at runtime by maplibre-gl via setWorkerUrl; the worker imports
        // maplibre-gl-shared.mjs relative to itself, so both must sit together
        // at the output root.
        {
          from: require.resolve('maplibre-gl/dist/maplibre-gl-worker.mjs'),
          to: 'maplibre-gl-worker.mjs',
        },
        {
          from: require.resolve('maplibre-gl/dist/maplibre-gl-shared.mjs'),
          to: 'maplibre-gl-shared.mjs',
        },
      ],
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
        resourceQuery: { not: [/asset/] },
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: [{ name: 'prefixIds' }],
              },
            },
          },
        ],
      },
    ],
  },
  // maplibre-gl builds a worker URL with `new URL(variable, import.meta.url)`,
  // which webpack cannot resolve statically. The expression is only evaluated
  // for cross-origin worker URLs, and setWorkerUrl points at a same-origin one.
  ignoreWarnings: [
    {
      module: /node_modules[\\/]maplibre-gl[\\/]/,
      message: /Critical dependency: the request of a dependency is an expression/,
    },
  ],
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
