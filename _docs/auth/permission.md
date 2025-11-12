## 🗂 Folder Structure Update

Add a dedicated folder for your **access control logic**:

```
src/
│
├── middlewares/
│   ├── auth.ts
│   ├── authorize.ts
│
├── permissions/
│   ├── roles.ts        ← 💡 NEW (defines roles + permissions)
│   ├── checkPermission.ts  ← 💡 NEW (middleware logic)
```

---

## 🧩 Step 1 — Define Roles & Permissions (`src/permissions/roles.ts`)

This file will define **which permissions** belong to each **role**.

Example for your habit tracker app:

```ts
// src/permissions/roles.ts

export type Permission =
  | "create_habit"
  | "update_habit"
  | "delete_habit"
  | "view_habit"
  | "create_tag"
  | "view_tag"
  | "assign_tag"
  | "manage_users";

export type Role = "user" | "admin";

interface RolePermissions {
  [key: string]: Permission[];
}

// Define permissions for each role
export const rolePermissions: RolePermissions = {
  user: [
    "create_habit",
    "update_habit",
    "delete_habit",
    "view_habit",
    "create_tag",
    "view_tag",
    "assign_tag",
  ],
  admin: [
    "create_habit",
    "update_habit",
    "delete_habit",
    "view_habit",
    "create_tag",
    "view_tag",
    "assign_tag",
    "manage_users", // Only admin can manage users
  ],
};

// Utility function to get permissions by role
export const getPermissionsForRole = (role: Role): Permission[] => {
  return rolePermissions[role] || [];
};
```

✅ This keeps permissions **declarative** and easy to modify.
You can later store these in a database if needed.

---

## 🔐 Step 2 — Create Permission Middleware (`src/permissions/checkPermission.ts`)

This middleware will check:

1. The user is authenticated (`req.user` exists)
2. Their role has the required permission

```ts
// src/permissions/checkPermission.ts
import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/custom-error";
import { getPermissionsForRole, Permission } from "./roles";

export const checkPermission =
  (...requiredPermissions: Permission[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      throw CustomError.Unauthorized("User not authenticated.");
    }

    const userPermissions = getPermissionsForRole(user.role);

    const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      throw CustomError.Forbidden("You do not have permission to perform this action.");
    }

    next();
  };
```

✅ Now you can **declare permissions per route** just like you did for `authorize()`.

---

## ⚙️ Step 3 — Use It in Your Routes

Example: `habit.routes.ts`

```ts
import express from "express";
import { protect } from "../middlewares/auth";
import { checkPermission } from "../permissions/checkPermission";
import { createHabit, getAllHabits } from "../controllers/habit.controller";

const router = express.Router();

router.use(protect);

// User can create a habit
router.post("/", checkPermission("create_habit"), createHabit);

// Admin can view all habits
router.get("/all", checkPermission("manage_users"), getAllHabits);

export default router;
```

This gives you **fine-grained control**:

- You can let a role do some actions but not others.
- You can expand permissions easily without touching middleware.

---

## 🧠 Step 4 — When to Use `authorize()` vs `checkPermission()`

| Middleware                        | Use Case                              | Example                                                  |
| --------------------------------- | ------------------------------------- | -------------------------------------------------------- |
| `authorize("admin")`              | Simple **role-based** control         | “Only admin can delete users”                            |
| `checkPermission("create_habit")` | Fine-grained **action-based** control | “User can create a habit, but not delete others’ habits” |

They can **coexist** — for example:

```ts
router.delete("/:id", protect, authorize("admin"), checkPermission("delete_habit"), deleteHabit);
```

---

## ⚡ Step 5 — Extend Later (Optional Ideas)

You can later:

1. Store `permissions` in MongoDB (dynamic management by admins)
2. Add `team-based` or `ownership-based` access control:
   - Example: a user can update only **their own** habit.

3. Integrate a `can()` helper for controllers:

   ```ts
   if (!can(req.user, "delete_habit")) throw CustomError.Forbidden(...);
   ```

---

## ✅ Full Example in Action

```ts
// src/routes/user.routes.ts
import express from "express";
import { protect } from "../middlewares/auth";
import { checkPermission } from "../permissions/checkPermission";
import { getUsers, deleteUser } from "../controllers/user.controller";

const router = express.Router();

router.use(protect);

router.get("/", checkPermission("manage_users"), getUsers);
router.delete("/:id", checkPermission("manage_users"), deleteUser);

export default router;
```

**Result:**

- Normal users: ❌ cannot access `/api/users`
- Admins: ✅ can manage all users

---

## 🔥 Summary

| File                             | Responsibility                        |
| -------------------------------- | ------------------------------------- |
| `permissions/roles.ts`           | Defines all permissions per role      |
| `permissions/checkPermission.ts` | Middleware to verify user permission  |
| `middlewares/auth.ts`            | Authenticates and attaches `req.user` |
| `middlewares/authorize.ts`       | Simple role-based guard               |
| `routes/*.ts`                    | Apply permissions to actions          |

---
