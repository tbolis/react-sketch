/*eslint no-console:0 */

require('core-js/fn/object/assign');

const path = require('path');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const NoErrorsPlugin = require('webpack/lib/NoErrorsPlugin');
const HotModuleReplacementPlugin = require('webpack/lib/HotModuleReplacementPlugin');

const srcPath = path.join(__dirname, 'src');
const examplesPath = path.join(__dirname, 'examples');

const OpenBrowserPlugin = require('open-browser-webpack-plugin');

const port = 23000;

var config = {
    port: port,
    entry: {
        examples: [
            'webpack-dev-server/client?http://localhost:' + port,
            'webpack/hot/only-dev-server',
            path.join(examplesPath, 'run')
        ]
    },
    output: {
        path: path.join(__dirname, '/build'),
        filename: 'index.js',
        publicPath: '/'
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    debug: true,
    cache: true,
    devtool: 'eval',
    devServer: {
        historyApiFallback: true,
        stats: {colors: true},
        publicPath: '/',
        noInfo: false,
        port: port,
        hot: true
    },
    module: {
        preLoaders: [
            {
                test: /\.(js|jsx)$/,
                include: [srcPath],
                exclude: /(node_modules|bower_components)/,
                loader: 'eslint-loader'
            }
        ],
        loaders: [
            {test: /\.css$/, loader: 'style-loader!css-loader'},
            {
                test: /\.(js|jsx)$/,
                include: [srcPath, examplesPath],
                exclude: /(node_modules|bower_components)/,
                loaders: ['react-hot', 'babel']
            }
        ]
    },
    plugins: [
        new HotModuleReplacementPlugin(),
        new NoErrorsPlugin(),
        new HtmlWebpackPlugin({
            title: 'React Sketch',
            description: 'Sketch Element for React based applications, backed-up by fabricjs as its core',
            keywords: ['react', 'canvas', 'sketch', 'fabricjs', 'fabric.js'],
            template: path.join(examplesPath, 'base.html'),
            inject: 'body',
            filename: 'index.html',
            chunks: ['examples']
        }),
        new OpenBrowserPlugin({url: 'http://localhost:' + port})
    ]
};

new WebpackDevServer(webpack(config), config.devServer)
    .listen(config.port, 'localhost', function (err) {
            if (err) {
                console.log(err);
            }
            console.log('Serving from http://localhost:' + config.port);
        }
    );
