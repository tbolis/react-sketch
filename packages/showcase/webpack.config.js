const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const port = 23000;

/**
 * Where the showcase is deployed (GitHub Pages). The link preview of the page (Open Graph
 * and Twitter card) needs absolute URLs, a relative one shows no image.
 */
const siteUrl = "https://tbolis.github.io/react-sketch/";

/** The files of public/ which the build copies as they are, the page links them by name */
const staticFiles = ["og-image.png", "apple-touch-icon.png", "favicon-32.png"];

class CopyStaticFiles {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap("CopyStaticFiles", (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: "CopyStaticFiles",
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          for (const name of staticFiles) {
            const file = path.join(__dirname, "public", name);
            compilation.fileDependencies.add(file);
            compilation.emitAsset(
              name,
              new webpack.sources.RawSource(fs.readFileSync(file))
            );
          }
        }
      );
    });
  }
}

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
    // Relative URLs, so the build works from any path, such as /react-sketch/ on GitHub Pages
    publicPath: "auto",
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
      title: "react-sketch showcase",
      description: "Sketch Component for React applications, backed-up by fabricjs",
      keywords: ["react", "canvas", "sketch", "fabricjs", "fabric.js"],
      inject: "body",
      filename: "index.html",
      template: "./public/base.html",
      favicon: "./public/favicon.ico",
      siteUrl,
    }),
    new CopyStaticFiles(),
  ],
};
