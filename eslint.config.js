const js = require("@eslint/js");
const globals = require("globals");
const tseslint = require("typescript-eslint");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const prettier = require("eslint-config-prettier/flat");
const { defineConfig, globalIgnores } = require("eslint/config");

module.exports = defineConfig([
  globalIgnores([
    "**/dist/",
    "**/coverage/",
    "**/node_modules/",
    // Temporary: legacy folders, removed once the port to packages/ is complete.
    "src/",
    "examples/",
    "webpack/",
  ]),
  {
    files: ["packages/**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      react.configs.flat.recommended,
      // Target is the automatic JSX runtime (no React import needed).
      react.configs.flat["jsx-runtime"],
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: { globals: globals.browser },
    settings: { react: { version: "detect" } },
    rules: {
      // Component props are typed with TypeScript.
      "react/prop-types": "off",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["packages/**/*.spec.{ts,tsx}"],
    languageOptions: { globals: globals.jest },
  },
  // Last: switches off rules that conflict with Prettier.
  prettier,
]);
