const webpack = require('webpack');
const path = require('path');

module.exports = {
  //mode: 'development',
  mode: 'production',
  entry: {
    bip39toalgo: '../src/bip39toalgo.js',
  },
  output: {
    filename: 'bip39toalgo.bundle.min.js',
    path: path.resolve(__dirname, '../dist/js_lib/bip39toalgo'),
    library: 'bip39toalgo',
  },
  plugins: [
        // Work around for Buffer is undefined:
        // https://github.com/webpack/changelog-v5/issues/10
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
  resolve: {
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve("stream-browserify"),
      events: require.resolve("events"),
      buffer: require.resolve("buffer"),
    },
    alias: {
       process: "process/browser",
    },
  },
  devtool: "source-map",
  //optimization: {
  //    minimize: false
  //},
};
