const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

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

module.exports = () => {
  return {
    mode: 'development',
    devtool: 'inline-source-map',
    entry: './src/index.js',
    target: 'web',
    output: {
      path: path.resolve(__dirname, 'public'),
      filename: 'index_bundle.js',
      publicPath: '/',
    },
    devServer: {
      contentBase: './public',
      historyApiFallback: true,
      watchOptions: { aggregateTimeout: 300, poll: 1000 },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods':
          'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers':
          'X-Requested-With, content-type, Authorization',
      },
      hot: true,
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
      new CleanWebpackPlugin(),
    ],
  }
}
