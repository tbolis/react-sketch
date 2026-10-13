const path = require("path");

const umdExternal = (name, root) => ({
  commonjs: name,
  commonjs2: name,
  amd: name,
  root,
});

module.exports = {
  entry: {
    index: "./src/index.ts",
  },
  // react and fabric are provided by the consumer, never bundled.
  externals: {
    react: umdExternal("react", "React"),
    "react/jsx-runtime": umdExternal("react/jsx-runtime", "ReactJSXRuntime"),
    fabric: umdExternal("fabric", "fabric"),
  },
  output: {
    filename: "[name].js",
    library: { name: "ReactSketch", type: "umd" },
    globalObject: "this",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
        options: {
          configFile: path.resolve(__dirname, "tsconfig.json"),
          onlyCompileBundledFiles: true,
        },
      },
    ],
  },
};
