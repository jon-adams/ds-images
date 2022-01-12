const path = require('path');
const slsWebpack = require('serverless-webpack');
const copyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: slsWebpack.lib.entries,
    externals: ['aws-sdk'],
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx', '.ttf']
    },
    target: 'node',
    mode: slsWebpack.lib.webpack.isLocal ? 'development' : 'production',
    module: {
        rules: [{
            test: /\.ts(x?)$/,
            loader: 'ts-loader'
        }]
    },
    optimization: {
      minimize: false,
    },
    plugins: [
        new copyWebpackPlugin({
            patterns: [
                { from: "src/**.ttf", to: "./" }
            ],
        })
    ]
};
