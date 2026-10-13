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
        // Type errors fail the build for spec files only. Type-checking the
        // production sources is the job of tsc, not of the test run.
        diagnostics: { exclude: ["**", "!**/*.spec.ts", "!**/*.spec.tsx"] },
      },
    ],
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/**/*.d.ts",
    // pure re-export barrels (history/index.ts and tools/index.ts hold code and stay in)
    "!src/index.ts",
    "!src/components/SketchField/index.ts",
    "!src/components/SketchField/tools/*/index.ts",
  ],
  coverageDirectory: "coverage",
};
