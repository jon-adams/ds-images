const path = require('path');
const slsWebpack = require('serverless-webpack');

module.exports = {
    entry: slsWebpack.lib.entries,
    externals: [ 'aws-sdk' ],
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx']
    },
    output: {
        libraryTarget: 'commonjs',
        path: path.join(__dirname, '.webpack'),
        filename: '[name].js'
    },
    target: 'node',
    module: {
        loaders: [{ test: /\.ts(x?)$/, loader: 'ts-loader' }]
    }
};
