## 🧱 Step 1. Install Dependencies

Run this in your project root:

```bash
npm install -D eslint prettier eslint-config-prettier eslint-plugin-prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-import eslint-plugin-simple-import-sort
```

### What each does:

| Package                            | Purpose                                           |
| ---------------------------------- | ------------------------------------------------- |
| `eslint`                           | The core linter                                   |
| `prettier`                         | Code formatter                                    |
| `eslint-config-prettier`           | Disables ESLint rules that conflict with Prettier |
| `eslint-plugin-prettier`           | Runs Prettier as an ESLint rule                   |
| `@typescript-eslint/parser`        | Parses TypeScript for ESLint                      |
| `@typescript-eslint/eslint-plugin` | TypeScript-specific linting rules                 |
| `eslint-plugin-import`             | Lints import/export consistency                   |
| `eslint-plugin-simple-import-sort` | Auto-sorts imports for consistency                |

---

## ⚙️ Step 2. Create ESLint Config

### 📄 `.eslintrc.cjs`

We’ll use `.cjs` (CommonJS) since ESLint configs aren’t fully ESM-safe yet.

```js
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
    "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
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
```

✅ This configuration:

- Lints TypeScript syntax
- Formats with Prettier rules
- Sorts and groups imports
- Ignores `dist/` (build output)

---

## 🧩 Step 3. Create Prettier Config

### 📄 `.prettierrc.json`

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "singleQuote": false,
  "semi": true,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "auto"
}
```

✅ This ensures consistent formatting across editors and CI.

---

## ⚙️ Step 4. Add Ignore Files

### 📄 `.eslintignore`

```bash
node_modules
dist
build
coverage
```

### 📄 `.prettierignore`

```bash
node_modules
dist
build
coverage
package-lock.json
```

---

## 🧠 Step 5. Add NPM Scripts

### In `package.json`:

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts --fix",
    "format": "prettier --write ."
  }
}
```

Now you can run:

```bash
npm run lint
npm run format
```

---

## 💡 Step 6. (Optional) VS Code Integration

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["typescript", "javascript"],
  "eslint.alwaysShowStatus": true,
  "files.eol": "\n"
}
```

✅ This makes ESLint + Prettier run automatically on save inside VS Code.

---

## ✅ Step 7. Test It

Run:

```bash
npm run lint
```

You’ll see something like:

```
✔ All files pass linting.
```

If you have formatting issues, run:

```bash
npm run format
```

---

## 🚀 Result

You now have:

| Feature                                   | Enabled |
| ----------------------------------------- | ------- |
| 🔍 TypeScript linting                     | ✅      |
| 💅 Prettier formatting                    | ✅      |
| 🔁 Auto import sorting                    | ✅      |
| 🧹 Auto fix on save                       | ✅      |
| 🧠 No conflicts between ESLint & Prettier | ✅      |

---
