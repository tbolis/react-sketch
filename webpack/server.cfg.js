/*eslint no-console:0 */

const Paths = require("./paths");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const NamedModulesPlugin = require("webpack/lib/NamedModulesPlugin");
const NoEmitOnErrorsPlugin = require("webpack/lib/NoEmitOnErrorsPlugin");
const HotModuleReplacementPlugin = require("webpack/lib/HotModuleReplacementPlugin");

const port = 23000;

module.exports = {
  mode: "development",
  entry: {
    examples: Paths.entryPath,
  },
  resolve: {
    extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
  },
  output: {
    path: Paths.buildPath,
    filename: "index.js",
    publicPath: "/",
  },
  devServer: {
    historyApiFallback: true,
    stats: { colors: true },
    publicPath: "/",
    noInfo: false,
    lazy: false,
    port: port,
    hot: true,
  },
  module: {
    rules: [
      { test: /\.css$/, loader: "style-loader!css-loader" },
      {
        test: /\.(js|jsx)$/,
        include: [Paths.srcPath, Paths.examplesPath],
        exclude: /(node_modules|bower_components|lib)/,
        loaders: ["babel-loader"],
      },
    ],
  },
  plugins: [
    new HotModuleReplacementPlugin(),
    new NamedModulesPlugin(),
    new NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({
      chunks: ["examples"],
      description: "Sketch Component for React applications, backed-up by fabricjs",
      inject: "body",
      filename: "index.html",
      keywords: ["react", "canvas", "sketch", "fabricjs", "fabric.js"],
      template: Paths.templatePath,
      title: "React Sketch",
    }),
  ],
};
