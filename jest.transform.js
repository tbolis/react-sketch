module.exports = require("babel-jest").createTransformer({
  presets: [
    [
      "@babel/preset-env",
      {
        "targets": {
          "browsers": [
            "last 2 versions",
            "ie > 9"
          ]
        }
      }
    ],
    "@babel/preset-react",
  ],
  plugins: [
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    ["@babel/plugin-proposal-class-properties", { "loose" : true }],
    "@babel/plugin-transform-react-inline-elements",
    "@babel/plugin-transform-react-constant-elements"
  ]
});
