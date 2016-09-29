/*global __dirname*/
/*eslint no-console:0 */

require('core-js/fn/object/assign');

const path = require('path');
const webpack = require('webpack');
const myLocalIP = require('my-local-ip');
const WebpackDevServer = require('webpack-dev-server');

const DefinePlugin = require('webpack/lib/DefinePlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const NoErrorsPlugin = require('webpack/lib/NoErrorsPlugin');
const OpenBrowserPlugin = require('open-browser-webpack-plugin');
const HotModuleReplacementPlugin = require('webpack/lib/HotModuleReplacementPlugin');

const srcPath = path.join(__dirname, 'src');
const examplesPath = path.join(__dirname, 'examples');

const port = 23000;
const host = myLocalIP();

const config = {
    port: port,
    entry: {
        examples: [
            'webpack-dev-server/client?http://' + host + ':' + port,
            'webpack/hot/only-dev-server',
            './examples/run'
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
    devtool: 'inline-source-map',
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
                exclude: /(node_modules|bower_components|lib)/,
                loader: 'eslint-loader'
            }
        ],
        loaders: [
            {test: /\.css$/, loader: 'style-loader!css-loader'},
            {
                test: /\.(js|jsx)$/,
                include: [srcPath, examplesPath],
                exclude: /(node_modules|bower_components|lib)/,
                loaders: ['babel']
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
        new DefinePlugin({
            'process.env': {
                'NODE_ENV': '"development"'
            }
        }),
        new OpenBrowserPlugin({url: 'http://' + host + ':' + port})
    ]
};

new WebpackDevServer(webpack(config), config.devServer)
    .listen(config.port, host, function (err) {
            if (err) {
                console.log(err);
            }
        console.log('Serving from http://' + host + ':' + port);
        }
    );
