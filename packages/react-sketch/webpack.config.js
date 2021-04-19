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
  externals: {
    jsdom: "null",
    canvas: "undefined",
    "canvas-prebuilt": "undefined",
    xmldom: JSON.stringify({ DOMParser: null }),
    "jsdom/lib/jsdom/utils": JSON.stringify({ Canvas: null }),
    "jsdom/lib/jsdom/living/generated/utils": JSON.stringify({
      implForWrapper: null,
    }),
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
