const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  entry: {
    index: "./src/index.ts",
  },
  performance: {
    hints: false,
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  output: {
    filename: "[name].js",
    library: "ReactSketch",
    libraryTarget: "umd",
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  devtool: "source-map",
  plugins: [new CleanWebpackPlugin()],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "awesome-typescript-loader",
        exclude: /node_modules/,
      },
    ],
  },
};
