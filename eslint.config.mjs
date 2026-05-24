import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts"],
    ignores: ["built/**", "node_modules/**", "pxt_modules/**", "shims.d.ts", "botsim/**"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: null,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_|^[Bb]utia" }],
      "eqeqeq": ["error", "always"],
      "semi": ["error", "always"],
      "@typescript-eslint/explicit-function-return-type": ["error", {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: false,
        allowDirectConstAssertionInArrowFunctions: false,
      }],
      "no-console": "warn",
    },
  },
  // PXT uses a global scope model with no ES imports/exports. Cross-file symbols
  // (interfaces, base classes, pin constants, singletons) appear unused to ESLint
  // because it only sees one file at a time. Same applies to shared test mocks
  // in test/_mocks.ts which are consumed by the *.test.ts files.
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // CLI scripts use console.log intentionally.
  {
    files: ["scripts/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
];
