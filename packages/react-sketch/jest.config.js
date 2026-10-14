/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: ["<rootDir>/src/**/*.spec.ts?(x)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  transform: {
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
