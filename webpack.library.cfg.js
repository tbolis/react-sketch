/*global __dirname, module*/

var path = require('path');

const DefinePlugin = require('webpack/lib/DefinePlugin');
const UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');
const NoEmitOnErrorsPlugin = require('webpack/lib/NoEmitOnErrorsPlugin');
const OccurrenceOrderPlugin = require('webpack/lib/optimize/OccurrenceOrderPlugin');
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
        extensions: ['.js', '.jsx']
    },
    cache: true,
    module: {
        loaders: [
            {
                test: /\.(js|jsx)$/,
                include: [srcPath],
                exclude: /(node_modules|bower_components|lib)/,
                loaders: ['babel-loader']
            }
        ]
    },
    plugins: [
        new UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new NoEmitOnErrorsPlugin(),
        new OccurrenceOrderPlugin(),
        new AggressiveMergingPlugin(),
        new DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        })
    ]
};