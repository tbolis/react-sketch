import js from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["**/dist/", "**/coverage/", "**/node_modules/"]),
  {
    files: ["packages/**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      eslintReact.configs["recommended-typescript"],
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: { globals: globals.browser },
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      // The public methods of SketchField (undo, toJSON, ...) are its ref API,
      // so they are not used inside the class.
      "@eslint-react/no-unused-class-component-members": "off",
    },
  },
  {
    files: ["packages/**/*.spec.{ts,tsx}"],
    languageOptions: { globals: globals.jest },
  },
  // Last: switches off rules that conflict with Prettier.
  prettier,
]);
