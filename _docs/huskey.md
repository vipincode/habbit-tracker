## ✅ Step 1: Install Husky

```bash
npm install --save-dev husky
```

Then add a `prepare` script in your `package.json` so Git hooks are installed automatically after dependencies:

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

That follows the official “Get started” guide. ([typicode.github.io][1])

---

## 🛠 Step 2: Initialize Husky hooks directory

Run in your terminal:

```bash
npx husky init
```

This will create a `.husky/` folder in your project root and configure Git to use it. ([typicode.github.io][1])

---

## 🔧 Step 3: Add Git hooks

For example, to add a pre-commit hook for linting + formatting:

```bash
npx husky add .husky/pre-commit "npm run lint"
npx husky add .husky/pre-commit "npm run format"
```

You can also combine commands in one hook script if preferred.

---

## 📄 Step 4: Example `package.json` snippet

```json
{
  "scripts": {
    "prepare": "husky install",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write ."
  }
}
```

And your `.husky/pre-commit` might look like:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run format
npm run lint
```

---

## 🧠 Step 5: (Optional but recommended) Add `lint-staged` for performance

Install:

```bash
npm install --save-dev lint-staged
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,js}": ["prettier --write", "eslint --fix"]
  }
}
```

Then modify pre-commit hook to use it:

```bash
npm run lint-staged
```

Perfect 🔥 — since you’ve already run

```bash
npx husky init
```

and Husky v9 created the `.husky/` folder ✅,
let’s fill it properly with **modern pre-commit and optional pre-push hooks**.

We’ll tailor it for your stack:
**TypeScript + ESLint + Prettier + (optionally lint-staged)**

---

## 📁 Folder Structure

```
.husky/
├── _
│   └── husky.sh
└── pre-commit
```

Husky automatically creates `_/husky.sh`.
You **don’t modify that file** — it sets up the environment for your hooks.
All your actual scripts go in files like `pre-commit`, `pre-push`, etc.

---

## ✅ Step 1: Create `.husky/pre-commit`

Inside `.husky/pre-commit`, paste:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run Prettier + ESLint only on staged files
echo "🔍 Running lint-staged..."
npx lint-staged
```

Make sure the file is executable:

```bash
chmod +x .husky/pre-commit
```

---

## ✅ Step 2: (Optional but Recommended) Use lint-staged

If you haven’t installed it yet:

```bash
npm install --save-dev lint-staged
```

Then in your `package.json`, add:

```json
{
  "lint-staged": {
    "*.{ts,js,tsx}": ["prettier --write", "eslint --fix"],
    "*.{json,md,html,css}": ["prettier --write"]
  }
}
```

Now every time you commit, Husky will:

1. Run Prettier + ESLint on **staged files only**.
2. Stop the commit if any linter errors remain.

---

## ✅ Step 3: (Optional) Add `.husky/pre-push`

If you want to block bad code before pushing, create `.husky/pre-push`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Running tests before push..."
npm test
```

Then:

```bash
chmod +x .husky/pre-push
```

This ensures no failing tests get pushed to remote.

---

## ✅ Step 4: Example `package.json` Summary

Your final scripts section should look like this:

```json
{
  "scripts": {
    "prepare": "husky",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write .",
    "test": "jest --passWithNoTests"
  },
  "lint-staged": {
    "*.{ts,js,tsx}": ["prettier --write", "eslint --fix"]
  }
}
```

---

## 💡 Step 5: Test It

1. Make a small change to a `.ts` file.
2. Run:

   ```bash
   git add .
   git commit -m "test husky"
   ```

3. You should see:

   ```
   🔍 Running lint-staged...
   ✔ prettier --write
   ✔ eslint --fix
   [main 1a2b3c] test husky
   ```

4. If linting fails → commit aborts automatically ✅

---

## ✅ Summary

| File                 | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `.husky/_/husky.sh`  | internal Husky bootstrap script          |
| `.husky/pre-commit`  | runs ESLint + Prettier (via lint-staged) |
| `.husky/pre-push`    | optional test runner before push         |
| `lint-staged` config | defines which files to format & lint     |

---
