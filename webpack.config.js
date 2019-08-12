const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const webpack = require('webpack')

// copy manifest.json to the path: 'public'
// this will allow for the authRequest to see the file at www.example.com/manifest.json
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ManifestAssetPlugin = new CopyWebpackPlugin([
  { from: 'src/assets/manifest.json', to: 'manifest.json' },
])
const IconAssetPlugin = new CopyWebpackPlugin([
  { from: 'src/images/**', to: '.', flatten: true },
])

const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackPluginConfig = new HtmlWebpackPlugin({
  template: './src/index.html',
  filename: 'index.html',
  inject: 'body',
})

const DefinePluginConfig = new webpack.DefinePlugin({
  'process.env': {
    LN_URI: JSON.stringify(process.env.LN_URI),
  },
})

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  entry: './src/index.js',
  target: 'web',
  output: {
    path: path.resolve('public'),
    filename: 'index_bundle.js',
  },
  devServer: {
    historyApiFallback: true,
    watchOptions: { aggregateTimeout: 300, poll: 1000 },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':
        'X-Requested-With, content-type, Authorization',
    },
  },
  module: {
    rules: [
      {
        test: /\.m?jsx?$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              '@babel/transform-runtime',
              '@babel/plugin-proposal-class-properties',
            ],
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      // { test: /\.jsx$/, loader: 'babel-loader', exclude: /node_modules/ },
      {
        test: /\.(eot|woff|woff2|ttf|svg|png|jpe?g|gif|ico)(\?\S*)?$/,
        loader: 'file-loader!url-loader',
      },
      { test: /\.css$/, loader: 'style-loader!css-loader' },
    ],
  },
  plugins: [
    HtmlWebpackPluginConfig,
    ManifestAssetPlugin,
    IconAssetPlugin,
    DefinePluginConfig,
    new CleanWebpackPlugin(),
  ],
}
