const js = require("@eslint/js");
const tsparser = require("@typescript-eslint/parser");
const globals = require("globals");

const tsEslintPlugin = require("@typescript-eslint/eslint-plugin");
const prettierPlugin = require("eslint-plugin-prettier");
const unusedImports = require("eslint-plugin-unused-imports");

module.exports = [
  js.configs.recommended,
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "*.config.js",
      "*.config.cjs",
      "*.config.mjs",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.node,
        ...globals.jest,
        NodeJS: "readonly",
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        exports: "readonly",
        module: "readonly",
        require: "readonly",
        global: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsEslintPlugin,
      prettier: prettierPlugin,
      "unused-imports": unusedImports,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
        },
      ],
      "unused-imports/no-unused-imports": "error",
      "prettier/prettier": "error",
      "no-case-declarations": "off",
      "no-undef": "off", // TypeScript handles this
    },
    settings: {
      jest: {
        version: "detect",
      },
    },
  },
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
];
