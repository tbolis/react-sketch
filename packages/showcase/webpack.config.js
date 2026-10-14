const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const port = 23000;

module.exports = {
  target: "web",
  entry: "./src/index.tsx",
  resolve: {
    extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
    alias: {
      // Use the library sources so the showcase runs without a prebuilt dist.
      "react-sketch": path.resolve(__dirname, "../react-sketch/src/index.ts"),
    },
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "bundle.js",
    clean: true,
  },
  devServer: {
    static: { directory: path.join(__dirname, "public") },
    devMiddleware: { stats: { colors: true } },
    port: port,
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        loader: "ts-loader",
        exclude: /node_modules/,
        // Types are checked by `yarn typecheck`.
        options: { transpileOnly: true },
      },
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader",
      },
      {
        test: /\.(css|scss)$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "React-Sketch Showcase",
      description: "Sketch Component for React applications, backed-up by fabricjs",
      keywords: ["react", "canvas", "sketch", "fabricjs", "fabric.js"],
      inject: "body",
      filename: "index.html",
      template: "./public/base.html",
      favicon: "./public/favicon.ico",
    }),
  ],
};
