module.exports = {
  plugins: ['@babel/plugin-proposal-class-properties'],
  presets: [
    [
      '@babel/env',
      {
        exclude: ['transform-regenerator'],
        useBuiltIns: 'usage',
        corejs: '3.6',
      },
    ],
    '@babel/preset-react',
    ...(!api.env('production') && { plugins: ['react-refresh/babel'] }),
  ],
};
