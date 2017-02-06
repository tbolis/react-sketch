/*global __dirname,module*/

const path = require('path');
const srcPath = path.join(__dirname, 'src');
const examplesPath = path.join(__dirname, 'examples');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');
const OccurrenceOrderPlugin = require('webpack/lib/optimize/OccurrenceOrderPlugin');
const AggressiveMergingPlugin = require('webpack/lib/optimize/AggressiveMergingPlugin');

const config = {
    entry: {
        examples: path.join(examplesPath, 'run')
    },
    output: {
        path: path.join(__dirname, '/build'),
        filename: 'index.js',
        publicPath: ''
    },
    resolve: {
        extensions: ['.js', '.jsx']
    },
    cache: true,
    devtool: 'source-map',
    module: {
        loaders: [
            {test: /\.html$/, loader: 'html-loader', include: [examplesPath], exclude: /base\.html$/},
            {test: /\.css$/, loader: 'style-loader!css-loader'},
            {
                test: /\.(js|jsx)$/,
                include: [srcPath, examplesPath],
                exclude: /(node_modules|bower_components|lib)/,
                loaders: ['babel-loader']
            }
        ]
    },
    plugins: [
        new UglifyJsPlugin(),
        new OccurrenceOrderPlugin(),
        new AggressiveMergingPlugin(),
        new DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new HtmlWebpackPlugin({
            title: 'React Sketch',
            description: 'Sketch Element for React based applications, backed-up by fabricjs as its core',
            keywords: ['react', 'canvas', 'sketch', 'fabricjs', 'fabric.js'],
            template: path.join(examplesPath, 'base.html'),
            filename: 'index.html',
            chunks: ['examples'],
            inject: 'body'
        })
    ]
};

module.exports = config;