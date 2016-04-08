var path = require('path');

const IgnorePlugin = require('webpack/lib/IgnorePlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const NoErrorsPlugin = require('webpack/lib/NoErrorsPlugin');
const DedupePlugin = require('webpack/lib/optimize/DedupePlugin');
const UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');
const OccurenceOrderPlugin = require('webpack/lib/optimize/OccurenceOrderPlugin');
const HotModuleReplacementPlugin = require('webpack/lib/HotModuleReplacementPlugin');
const AggressiveMergingPlugin = require('webpack/lib/optimize/AggressiveMergingPlugin');

const srcPath = path.join(__dirname, 'src');

function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }
    return false;
}

const externals = [];
const explicitExternals = [];
const internals = ['fabric', 'canvas'];
Object.keys(require('./package.json').devDependencies).forEach(function (k) {
    if (!containsObject(k, internals)) externals.push(k);
});

module.exports = {
    entry: {
        src: './src'
    },
    output: {
        path: path.join(__dirname, 'lib'),
        filename: 'index.js',
        libraryTarget: 'umd'
    },
    //Every non-relative module is external apart from those given.
    //externals: [/^(?!fabric|canvas|base64-js|ieee754|isarray|jsdom|xmldom)[a-z\-0-9]+$/],
    externals: explicitExternals.concat(externals),
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    debug: false,
    cache: true,
    module: {
        loaders: [
            {
                test: /\.(js|jsx)$/,
                include: [srcPath],
                exclude: /(node_modules|bower_components|lib)/,
                loaders: ['babel']
            }
        ]
    },
    plugins: [
        // minify on production
        new DedupePlugin(),
        new UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new OccurenceOrderPlugin(),
        new AggressiveMergingPlugin(),
        new IgnorePlugin(new RegExp('^(fs|ipc)$')),
        new DefinePlugin({'process.env.NODE_ENV': '"production"'}),
        new HotModuleReplacementPlugin(),
        new NoErrorsPlugin()
    ]
};