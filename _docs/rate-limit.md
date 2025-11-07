## ✅ Step 1. Install Dependency

```bash
npm install express-rate-limit
npm install -D @types/express-rate-limit
```

---

## ⚙️ Step 2. Create a Reusable Rate Limiter Utility

Let’s create a reusable utility file so you can apply different rate limits for different routes.

### 📁 `src/middlewares/rate-limit.ts`

```ts
import rateLimit from "express-rate-limit";
import { ENV } from "../config/env.js";

// Default values (can be tuned via environment)
const windowMs = 15 * 60 * 1000; // 15 minutes
const maxRequests = 100; // 100 requests per IP per window

export const apiLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
});

// Special limiter for login or sensitive routes
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 login attempts per 10 minutes
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});
```

---

## ⚙️ Step 3. Apply the Limiter Globally or to Specific Routes

You have two good options — depending on how strict you want to be:

### **Option A: Apply Global Rate Limiting**

(for all `/api` requests)

Update your `src/app.ts`:

```ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import { router } from "./routes/index.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { apiLimiter } from "./middlewares/rate-limit.js";

export const app = express();

// Security & Utility middlewares
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(morgan("combined"));

// Apply global rate limiter (applies to all routes under /api)
app.use("/api", apiLimiter);

// Routes
app.use("/api", router);

// Not found + global error handlers
app.use(notFoundHandler);
app.use(errorHandler);
```

✅ This adds rate limiting across the entire `/api/*` namespace.
100 requests per 15 minutes per IP by default.

---

### **Option B: Apply to Sensitive Routes Only**

For example, only protect `/users/login`.

Update your `src/routes/user.routes.ts`:

```ts
import { Router } from "express";
import { User } from "../models/user.model.js";
import { authLimiter } from "../middlewares/rate-limit.js";

const userRouter = Router();

// Apply rate limiting to login route only
userRouter.post("/login", authLimiter, async (req, res, next) => {
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

✅ This only rate-limits login attempts (e.g., 5 per 10 minutes per IP).
Other routes remain unaffected.

---

## ⚙️ Step 4. Optional — Make Rate Limits Environment Configurable

You can extend your `src/config/env.schema.ts` to include rate-limiting values:

```ts
RATE_LIMIT_WINDOW_MS: z
  .string()
  .default("900000") // 15 minutes
  .transform(Number),
RATE_LIMIT_MAX: z
  .string()
  .default("100")
  .transform(Number),
```

Then in your limiter file:

```ts
const windowMs = ENV.RATE_LIMIT_WINDOW_MS;
const maxRequests = ENV.RATE_LIMIT_MAX;
```

This allows dynamic tuning (e.g., higher limits in staging, stricter in production).

---

## ✅ Step 5. Test the Rate Limiter

### 🔁 Test Login Limiter

Make repeated `POST` requests to:

```
POST http://localhost:4000/api/users/login
```

After 5 failed attempts (within 10 minutes), you’ll get:

```json
{
  "success": false,
  "message": "Too many login attempts. Please try again later."
}
```

### 🔁 Test API Limiter

Send multiple requests (100+) to:

```
GET http://localhost:4000/api/health/db
```

After the limit is hit:

```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

---

## 🧠 Optional Enhancements for Real-World Usage

| Feature                          | Description                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| ⚙️ **Redis-backed rate limiter** | Use `rate-limit-redis` for multi-instance deployments (e.g., Docker + Load Balancer). |
| 🔑 **User-based limiter**        | Use a custom key generator to rate-limit per user/token instead of per IP.            |
| 📊 **Metrics**                   | Hook into rate limit events for monitoring (e.g., track blocked IPs).                 |
| 🛡️ **Dynamic limits**            | Adjust rate limits for logged-in vs anonymous users.                                  |

---

## ✅ You Now Have:

- 🧠 Configurable rate-limiting middleware
- 🔐 Protection for sensitive endpoints (e.g., `/login`)
- 🧩 Type-safe environment-driven setup
- 🚀 Scalable, production-grade behavior (ready for Docker, load balancers, etc.)

---
