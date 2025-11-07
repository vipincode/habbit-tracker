module.exports = {
  root: true,
  env: {
    node: true,
    es2024: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json"],
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "prettier", "import", "simple-import-sort"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended", // Integrates Prettier
  ],
  rules: {
    /* 🧹 TypeScript Rules */
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports" },
    ],
    "@typescript-eslint/no-explicit-any": "off", // Allow 'any' when explicitly needed

    /* 🧩 Import Sorting */
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "import/order": "off",

    /* 💅 Prettier Integration */
    "prettier/prettier": [
      "error",
      {
        printWidth: 100,
        semi: true,
        singleQuote: false,
        trailingComma: "es5",
        tabWidth: 2,
        endOfLine: "auto",
      },
    ],
  },
  ignorePatterns: ["dist/", "node_modules/", "*.config.*"],
};
