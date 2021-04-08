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
    contentBase: path.join(__dirname, "src"),
    stats: { colors: true },
    port: port,
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
        test: /\.(css|scss)$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(jpg|jpeg|png|gif|mp3|svg)$/,
        use: ["file-loader"],
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
