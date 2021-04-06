const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const port = 23000;

module.exports = {
  target: "web",
  mode: "development",
  entry: "./src/index.tsx",
  resolve: {
    extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "bundle.js",
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
      {
        test: /\.(ts|tsx)$/,
        loader: "awesome-typescript-loader",
      },
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader",
      },
      {
        test: /\.css$/,
        loader: "css-loader",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      description:
        "Sketch Component for React applications, backed-up by fabricjs",
      inject: "body",
      filename: "index.html",
      keywords: ["react", "canvas", "sketch", "fabricjs", "fabric.js"],
      template: "./src/base.html",
      title: "React-Sketch Showcase",
    }),
  ],
};
