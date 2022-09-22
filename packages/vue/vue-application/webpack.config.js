const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  entry: './src/index.js',
  experiments: {
    outputModule: true,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    library: {
      type: 'module',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/'),
    },
    extensions: ['.ts', '.js'],
  },
  mode: 'production',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.scss/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'css-loader',
            options: {
              modules: {
                exportLocalsConvention: 'camelCase',
              },
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader',
        ],
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
  ],
};
