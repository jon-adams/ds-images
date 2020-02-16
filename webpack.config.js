const path = require('path');
const slsWebpack = require('serverless-webpack');
const copyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: slsWebpack.lib.entries,
    externals: ['aws-sdk'],
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx', '.ttf']
    },
    output: {
        libraryTarget: 'commonjs',
        path: path.join(__dirname, '.webpack'),
        filename: '[name].js'
    },
    target: 'node',
    mode: "production",
    module: {
        rules: [{
            test: /\.ts(x?)$/,
            loader: 'ts-loader'
        }]
    },
    plugins: [new copyWebpackPlugin([{ from: 'src/**.ttf', to: './' }])]
};
