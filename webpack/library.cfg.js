const Paths = require('./paths');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const NoEmitOnErrorsPlugin = require('webpack/lib/NoEmitOnErrorsPlugin');
const OccurrenceOrderPlugin = require('webpack/lib/optimize/OccurrenceOrderPlugin');
const AggressiveMergingPlugin = require('webpack/lib/optimize/AggressiveMergingPlugin');
const ModuleConcatenationPlugin = require('webpack/lib/optimize/ModuleConcatenationPlugin');

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
Object.keys(require('../package.json').devDependencies).forEach(function(k) {
  if (!containsObject(k, internals)) externals.push(k);
});

module.exports = {
  entry: {
    src: './src'
  },
  performance: {
    hints: false
  },
  output: {
    path: Paths.outputPath,
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
    rules: [
      {
        test: /\.(js|jsx)$/,
        include: [Paths.srcPath],
        exclude: /(node_modules|bower_components|lib)/,
        loaders: ['babel-loader']
      }
    ]
  },
  plugins: [
    new ModuleConcatenationPlugin(),
    new UglifyJsPlugin({
      parallel: true,
      uglifyOptions: {
        warnings: false
      }
    }),
    new NoEmitOnErrorsPlugin(),
    new OccurrenceOrderPlugin(),
    new AggressiveMergingPlugin(),
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ]
};