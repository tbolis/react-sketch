/*global process,module,__dirname*/

'use strict';

var path = require('path');
var srcPath = path.join(__dirname, 'src');
var testPath = path.join(__dirname, 'test');

// Set environment to testing
process.env.NODE_ENV = 'testing';

module.exports = function (config) {
    config.set({
        basePath: './',
        browsers: ['PhantomJS'],
        files: [
            'test/**/*Test.js'
        ],
        preprocessors: {
            'test/**/*Test.js': ['webpack', 'sourcemap']
        },
        captureTimeout: 60000,
        frameworks: ['phantomjs-shim', 'mocha', 'chai'],
        client: {
            mocha: {},
            captureConsole: false
        },
        singleRun: true,
        reporters: ['mocha'], //, 'coverage'
        webpack: {
            node: {
                fs: 'empty'
            },
            resolve: {
                extensions: ['.js', '.jsx'],
                alias: {
                    'react-sketch': srcPath
                }
            },
            module: {
                loaders: [
                    {
                        test: /\.(js|jsx)$/,
                        include: [srcPath, testPath],
                        exclude: /(node_modules|bower_components|examples)/,
                        loaders: ['babel-loader']
                    }
                ]
            },
            devtool: 'inline-source-map',
            stats: {
                colors: true,
                reasons: true
            }
        },
        webpackServer: {
            noInfo: true
        },
        webpackMiddleware: {
            noInfo: true,
            stats: {
                chunks: false
            }
        },
        coverageReporter: {
            dir: 'coverage/',
            reporters: [
                {type: 'html'},
                {type: 'text'}
            ]
        }
    });
};
