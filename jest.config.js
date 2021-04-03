module.exports = {
  roots: ["src"],

  // "automock": false,
  // "testEnvironment": "jest-environment-jsdom",
  // "testRegex": "./src/.spec.jsx?$",

  transform: {
    "^.+\\.(j|t)sx?$": "babel-jest",
    "^.+\\.svg$": "jest-svg-transformer",
  },
  moduleNameMapper: {
    "\\.(css)$": "identity-obj-proxy",
  },
  moduleDirectories: ["node_modules"],
  setupFilesAfterEnv: ["./jest.setup.js"],
  // setupTestFrameworkScriptFile: "./jest.setup.js",

  moduleFileExtensions: ["js", "json", "jsx"],
};
