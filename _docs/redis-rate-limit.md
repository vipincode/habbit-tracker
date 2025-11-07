## 🧩 Step 1. Install Required Packages

```bash
npm install express-rate-limit rate-limit-redis ioredis
npm install -D @types/express-rate-limit
```

> 🧠 Why `ioredis`?
> It’s the most reliable Redis client for Node.js — supports clustering, TLS, Sentinel, and works great with Redis Cloud or AWS ElastiCache.

---

## ⚙️ Step 2. Add Redis Configuration to Your Environment

In your `.env.*` files:

```bash
REDIS_URL=redis://localhost:6379
```

or for production:

```bash
REDIS_URL=rediss://:<password>@<your-redis-host>:6379
```

---

## ⚙️ Step 3. Extend Zod Environment Schema — `src/config/env.schema.ts`

Add Redis config:

```ts
REDIS_URL: z
  .string()
  .min(1, "REDIS_URL is required")
  .describe("Redis connection string for distributed rate limiting"),
```

---

## ⚙️ Step 4. Create Redis Client — `src/config/redis.ts`

This is a central connection handler for Redis that you can reuse across the app (e.g., caching, sessions, rate limiting).

```ts
import Redis from "ioredis";
import { ENV } from "./env.js";

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(ENV.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      reconnectOnError: (err) => {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) return true; // reconnect if node is read-only
        return false;
      },
    });

    redis.on("connect", () => console.log("🟢 Connected to Redis"));
    redis.on("error", (err) => console.error("🔴 Redis error:", err.message));
  }

  return redis;
}
```

---

## ⚙️ Step 5. Update Rate Limiter Middleware — `src/middlewares/rate-limit.ts`

Now we’ll use `rate-limit-redis` to persist rate-limiting state across all servers.

```ts
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { getRedisClient } from "../config/redis.js";

const redisClient = getRedisClient();

// Global API limiter
export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth limiter (stricter for login/signup)
export const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

## ⚙️ Step 6. Apply the Limiter to Routes

Same as before, either globally or per route:

### Option A — Global (`src/app.ts`):

```ts
import { apiLimiter } from "./middlewares/rate-limit.js";
app.use("/api", apiLimiter);
```

### Option B — Per-route (`src/routes/user.routes.ts`):

```ts
import { authLimiter } from "../middlewares/rate-limit.js";
userRouter.post("/login", authLimiter, async (req, res, next) => {
  // login logic
});
```

---

## 🧠 Step 7. Test the Distributed Rate Limiter

### 🧪 Local Test

Run two instances of your API on different ports:

```bash
PORT=4000 npm run dev
PORT=4001 npm run dev
```

Then make repeated requests to `/api/health/db` or `/api/users/login`.
Both instances will **share the same rate limit** count via Redis ✅

---

## 🧩 Step 8. Graceful Redis Handling (Optional but Recommended)

Update your `server.ts` for a graceful shutdown:

```ts
import { app } from "./app.js";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { getRedisClient } from "./config/redis.js";

async function startServer() {
  try {
    await connectDB();

    const redis = getRedisClient();

    app.listen(ENV.PORT, () => {
      console.log(`🚀 Server running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`);
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await redis.quit();
      console.log("🔌 Redis connection closed");
      process.exit(0);
    });
  } catch (err) {
    console.error("❌ Server startup error:", (err as Error).message);
    process.exit(1);
  }
}

startServer();
```

---

## ✅ Step 9. Test Redis Connection

To confirm your Redis setup works:

```bash
redis-cli ping
# PONG
```

And check logs when server starts:

```
🟢 Connected to Redis
✅ MongoDB connected [production]
🚀 Server running on port 4000 in production mode
```

If Redis is unreachable:

```
🔴 Redis error: connect ECONNREFUSED 127.0.0.1:6379
```

---

## 🧾 Summary

| Feature                 | Description                               |
| ----------------------- | ----------------------------------------- |
| 🧩 `express-rate-limit` | Standard middleware for rate limiting     |
| 🔁 `rate-limit-redis`   | Persists rate limits across instances     |
| ⚡ `ioredis`            | Fast and reliable Redis client            |
| 🧠 Graceful shutdown    | Closes Redis & DB connections on exit     |
| 🌍 Scalable             | Works behind load balancers or containers |

---

## ✅ You Now Have:

- Distributed rate limiting across all instances
- Secure login protection (anti-brute force)
- Central Redis connection (reusable for caching later)
- Production-safe retry and cleanup handling
- Environment-validated setup via Zod
