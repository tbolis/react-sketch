/** @type {import('jest').Config} */
// REACT=18 runs the tests on React 18, which is installed under another name
// (react-18, react-dom-18) next to React 19. Testing Library 16 supports 18 and 19,
// not 17, so 17 is not tested.
const react18 =
  process.env.REACT === "18"
    ? {
        moduleNameMapper: {
          "^react$": "react-18",
          "^react/(.*)$": "react-18/$1",
          "^react-dom$": "react-dom-18",
          "^react-dom/(.*)$": "react-dom-18/$1",
        },
      }
    : {};

module.exports = {
  ...react18,
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: ["<rootDir>/src/**/*.spec.ts?(x)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  // @erase2d/fabric is published as ES modules only, so it is compiled too
  transformIgnorePatterns: ["/node_modules/(?!@erase2d)"],
  transform: {
    "^.+\\.m?js$": [
      "ts-jest",
      {
        tsconfig: { allowJs: true, module: "commonjs", target: "es2020" },
        diagnostics: false,
      },
    ],
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
        // Only spec files are type-checked during the test run. Type errors in
        // production sources are reported by tsc, so they do not fail tests.
        // Remove the line below to type-check every file imported by a test.
        diagnostics: { exclude: ["**", "!**/*.spec.ts", "!**/*.spec.tsx"] },
      },
    ],
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/**/*.d.ts",
    // Re-export barrels only: history/index.ts and tools/index.ts hold code, so
    // they stay in the report.
    "!src/index.ts",
    "!src/components/SketchField/index.ts",
    "!src/components/SketchField/tools/*/index.ts",
  ],
  coverageDirectory: "coverage",
};
