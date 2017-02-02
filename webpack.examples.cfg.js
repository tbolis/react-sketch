/*global __dirname,module*/

const path = require('path');
const srcPath = path.join(__dirname, 'src');
const examplesPath = path.join(__dirname, 'examples');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const IgnorePlugin = require('webpack/lib/IgnorePlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');
const NoEmitOnErrorsPlugin = require('webpack/lib/NoEmitOnErrorsPlugin');
const OccurrenceOrderPlugin = require('webpack/lib/optimize/OccurrenceOrderPlugin');
const HotModuleReplacementPlugin = require('webpack/lib/HotModuleReplacementPlugin');
const AggressiveMergingPlugin = require('webpack/lib/optimize/AggressiveMergingPlugin');


var config = {
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
        new IgnorePlugin(new RegExp('^(fs|ipc)$')),
        new DefinePlugin({
            'process.env': {
                'NODE_ENV': '"production"'
            }
        }),
        new HotModuleReplacementPlugin(),
        new NoEmitOnErrorsPlugin(),
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