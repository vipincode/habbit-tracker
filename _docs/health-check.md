1. 🩺 A **Database Health Check API** (`/api/health/db`) for uptime monitoring and deployment readiness
2. 🔐 **Secure password hashing** in the `User` model using `bcrypt`

Let’s go step-by-step — clean, typed, and production-grade 👇

---

## ⚙️ Step 1. Install `bcrypt`

We’ll use the `bcrypt` library for password hashing (not `bcryptjs`, since you’re in Node 24 which supports native C++ addons).

```bash
npm install bcrypt
npm install -D @types/bcrypt
```

---

## 🔐 Step 2. Update User Model for Password Hashing — `src/models/user.model.ts`

We’ll add a pre-save hook to hash passwords and ensure secure comparison later.

```ts
import { Schema, model, type Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // 🔒 prevent password from being returned by default
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

// ✅ Hash password before saving
userSchema.pre("save", async function (next) {
  const user = this as IUser;

  // Hash only if password is modified or new
  if (!user.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  next();
});

// ✅ Add method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>("User", userSchema);
```

---

## 🧠 Step 3. Add a Secure User Registration Route

### `src/routes/user.routes.ts`

We’ll use this to test password hashing and DB insertion.

```ts
import { Router } from "express";
import { User } from "../models/user.model.js";

const userRouter = Router();

// Create new user (auto-hashes password)
userRouter.post("/", async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    // Return without password
    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({ success: true, data: userData });
  } catch (err) {
    next(err);
  }
});

// Example route to test login
userRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    res.status(200).json({ success: true, message: "Login successful" });
  } catch (err) {
    next(err);
  }
});

export default userRouter;
```

---

## 🩺 Step 4. Create Database Health Check Route

### `src/routes/health.routes.ts`

This helps you (and your monitoring tools like UptimeRobot or Kubernetes probes) confirm DB status.

```ts
import { Router } from "express";
import mongoose from "mongoose";

const healthRouter = Router();

healthRouter.get("/db", async (_req, res) => {
  const state = mongoose.connection.readyState;

  const states = {
    0: "🔴 Disconnected",
    1: "🟢 Connected",
    2: "🟠 Connecting",
    3: "🟣 Disconnecting",
  };

  res.json({
    success: true,
    status: states[state as keyof typeof states],
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default healthRouter;
```

---

## 🔗 Step 5. Register Routes

Update your main route file `src/routes/index.ts`:

```ts
import { Router } from "express";
import userRouter from "./user.routes.js";
import healthRouter from "./health.routes.js";

export const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Welcome to the Express + TS + Mongo API" });
});

router.use("/users", userRouter);
router.use("/health", healthRouter);
```

---

## 🧪 Step 6. Test Everything

### ✅ Test 1: Database Health Check

```bash
GET http://localhost:4000/api/health/db
```

**Response:**

```json
{
  "success": true,
  "status": "🟢 Connected",
  "uptime": 182.19,
  "timestamp": "2025-11-01T09:45:02.632Z"
}
```

### ✅ Test 2: Create User

```bash
POST http://localhost:4000/api/users
Content-Type: application/json

{
  "name": "Vipin Singh",
  "email": "vipin@example.com",
  "password": "mypassword123"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "_id": "6725f7f1bc5f2f91a3...",
    "name": "Vipin Singh",
    "email": "vipin@example.com",
    "role": "user",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### ✅ Test 3: Login

```bash
POST http://localhost:4000/api/users/login
Content-Type: application/json

{
  "email": "vipin@example.com",
  "password": "mypassword123"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful"
}
```

---

## 🧩 Step 7. Production-Grade Enhancements (Optional but Recommended)

| Feature                              | Description                                             |
| ------------------------------------ | ------------------------------------------------------- |
| 🔐 **JWT Auth**                      | Issue tokens on login for secure sessions               |
| 🧾 **Zod Validation**                | Validate `req.body` for user registration/login         |
| ⚙️ **Rate Limiting**                 | Prevent brute-force attacks on `/login`                 |
| 🧠 **Helmet & CORS (already added)** | Secures common headers                                  |
| 🩺 **Health Route**                  | Ready for uptime monitoring (Kubernetes, Render, etc.)  |
| 💾 **Indexes**                       | Add indexes to frequently queried fields (like `email`) |

---

## ✅ You Now Have:

- 🔗 **MongoDB connection with retry + pool + graceful shutdown**
- 🔐 **Secure password hashing with bcrypt**
- 👤 **User model with TS types and methods**
- 🩺 **Database health check endpoint**
- 🧠 **Error-safe and typed Express routes**

---
