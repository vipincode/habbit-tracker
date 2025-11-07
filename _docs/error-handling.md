## 🧱 Goal

✅ Create a **User Controller** that handles logic (register, login, getUser)
✅ Add a **CustomError class** for consistent error responses
✅ Add a **global reusable errorHandler middleware**
✅ Ensure full TypeScript typing across layers

---

## 📁 Final Folder Structure

```
src/
├── app.ts
├── server.ts
├── config/
│   ├── db.ts
│   ├── env.ts
│   ├── env.schema.ts
│   └── redis.ts
├── controllers/
│   └── user.controller.ts
├── middlewares/
│   ├── error-handler.ts
│   ├── not-found.ts
│   └── rate-limit.ts
├── models/
│   └── user.model.ts
├── routes/
│   ├── user.routes.ts
│   ├── health.routes.ts
│   └── index.ts
└── utils/
    └── custom-error.ts
```

---

## 🧠 Step 1. Create a Custom Error Utility — `src/utils/custom-error.ts`

This gives you a consistent, typed structure for throwing application errors.

```ts
export class CustomError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintain prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }

  static BadRequest(msg: string) {
    return new CustomError(msg, 400);
  }

  static Unauthorized(msg = "Unauthorized") {
    return new CustomError(msg, 401);
  }

  static Forbidden(msg = "Forbidden") {
    return new CustomError(msg, 403);
  }

  static NotFound(msg = "Not Found") {
    return new CustomError(msg, 404);
  }

  static Internal(msg = "Internal Server Error") {
    return new CustomError(msg, 500);
  }
}
```

Now you can throw consistent, typed errors anywhere in your app:

```ts
throw CustomError.BadRequest("Email already in use");
```

---

## ⚙️ Step 2. Create a Central Error Handler Middleware — `src/middlewares/error-handler.ts`

This middleware catches thrown errors (sync or async) and returns consistent JSON responses.

```ts
import type { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/custom-error.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Default values
  let statusCode = 500;
  let message = "Internal Server Error";

  if (err instanceof CustomError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  // Log errors only for non-operational (unexpected) ones
  if (!(err instanceof CustomError)) {
    console.error("💥 Unhandled Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}
```

This now handles **all thrown errors** gracefully across routes and controllers.

---

## 👤 Step 3. Create User Controller — `src/controllers/user.controller.ts`

Here we’ll define cleanly separated logic for user registration and login.

```ts
import type { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model.js";
import { CustomError } from "../utils/custom-error.js";

export class UserController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;

      // Check existing user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw CustomError.BadRequest("Email already registered");
      }

      const user = await User.create({ name, email, password });
      const userObj = user.toObject();
      delete userObj.password;

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: userObj,
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select("+password");
      if (!user) throw CustomError.BadRequest("Invalid email or password");

      const isMatch = await user.comparePassword(password);
      if (!isMatch) throw CustomError.BadRequest("Invalid email or password");

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: { id: user._id, email: user.email },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await User.find().select("-password");
      res.status(200).json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (err) {
      next(err);
    }
  }
}
```

---

## 🚦 Step 4. Update Routes — `src/routes/user.routes.ts`

We’ll use the controller methods cleanly here:

```ts
import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authLimiter } from "../middlewares/rate-limit.js";

const userRouter = Router();

userRouter.post("/", UserController.register);
userRouter.post("/login", authLimiter, UserController.login);
userRouter.get("/", UserController.getAll);

export default userRouter;
```

---

## 🧩 Step 5. Ensure Global Error Handler is Used in `app.ts`

```ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { router } from "./routes/index.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { errorHandler } from "./middlewares/error-handler.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(morgan("combined"));

app.use("/api", router);

// Not found route
app.use(notFoundHandler);

// ✅ Centralized error handler
app.use(errorHandler);
```

---

## 🧪 Step 6. Test It

### ✅ Create user

```bash
POST /api/users
{
  "name": "Vipin",
  "email": "vipin@example.com",
  "password": "mypassword123"
}
```

→ Response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "name": "Vipin",
    "email": "vipin@example.com",
    "_id": "..."
  }
}
```

### ❌ Try registering same email again

```bash
POST /api/users
{
  "name": "Vipin",
  "email": "vipin@example.com",
  "password": "mypassword123"
}
```

→ Response:

```json
{
  "success": false,
  "message": "Email already registered"
}
```

### ✅ Invalid login

```bash
POST /api/users/login
{
  "email": "vipin@example.com",
  "password": "wrongpassword"
}
```

→ Response:

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## 🧾 Summary

| Component           | Responsibility                                              |
| ------------------- | ----------------------------------------------------------- |
| `CustomError`       | Typed, reusable error wrapper for consistency               |
| `errorHandler`      | Global Express middleware that catches & formats all errors |
| `UserController`    | Encapsulates route logic cleanly                            |
| `user.routes.ts`    | Simple mapping of routes → controllers                      |
| ✅ TypeScript       | All types enforced for safer coding                         |
| 🚀 Production-grade | Clean, scalable, testable                                   |

---
