**robust, production-ready MongoDB connection layer** that handles:

- ✅ Retry logic
- ✅ Connection pooling
- ✅ Graceful shutdowns
- ✅ Strict logging and error handling
- ✅ Environment-driven tuning
- ✅ Monitoring hooks

---

## 🧠 What “Production-Grade” Really Means for a MongoDB Connection

| Feature                        | Why It Matters                                               |
| ------------------------------ | ------------------------------------------------------------ |
| Retry on startup failure       | Cloud DBs (like Atlas) can delay readiness during deployment |
| Unified topology & pool tuning | Prevents “too many connections” under load                   |
| Graceful shutdown              | Avoids corrupted sockets / unacknowledged writes             |
| Proper error logging           | Detect connection drops early                                |
| Environment-based settings     | Different behavior for dev vs prod (e.g., debug logs)        |

---

## ✅ Here’s the Production-Grade Version of `connectDB`

### `src/config/db.ts`

```ts
import mongoose from "mongoose";
import { ENV } from "./env.js";

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  const options: mongoose.ConnectOptions = {
    autoIndex: ENV.NODE_ENV !== "production", // disable auto-indexing in prod
    maxPoolSize: 10, // connection pool size
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000, // fail fast if DB is unreachable
    socketTimeoutMS: 45000, // close stale sockets
    connectTimeoutMS: 10000, // initial connection timeout
  };

  const connectWithRetry = async (retries = 5, delay = 3000): Promise<void> => {
    try {
      await mongoose.connect(ENV.MONGO_URI, options);
      isConnected = true;
      console.log(`✅ MongoDB connected [${ENV.NODE_ENV}]`);
    } catch (error) {
      console.error(`❌ MongoDB connection failed: ${(error as Error).message}`);

      if (retries > 0) {
        console.warn(`🔁 Retrying connection in ${delay / 1000}s (${retries} attempts left)...`);
        await new Promise((res) => setTimeout(res, delay));
        return connectWithRetry(retries - 1, delay);
      }

      console.error("🚫 All retries failed. Exiting process.");
      process.exit(1);
    }
  };

  await connectWithRetry();

  // Handle runtime disconnects
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("🔄 MongoDB reconnected.");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❗ MongoDB connection error:", err);
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed due to app termination");
    process.exit(0);
  });
}
```

---

## 💡 Key Improvements

| Improvement                  | Explanation                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| 🔁 **Retry logic**           | Retries up to 5 times with a 3-second delay. Perfect for containers or orchestrated environments. |
| ⚙️ **Pool tuning**           | `maxPoolSize` and `minPoolSize` prevent resource exhaustion under load.                           |
| 🧯 **Timeouts**              | Avoids hanging connections that stall API responses.                                              |
| 🧠 **Conditional autoIndex** | `autoIndex` is off in production for performance (Mongo builds indexes slower under heavy load).  |
| 🚦 **Lifecycle hooks**       | Logs reconnects/disconnects cleanly for observability.                                            |
| 🧹 **Graceful shutdown**     | Closes DB before app exits (avoiding "Mongo network error").                                      |

---

## ⚙️ Update Your `server.ts` to Use It Safely

```ts
import { app } from "./app.js";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";

async function startServer() {
  try {
    await connectDB();

    app.listen(ENV.PORT, () => {
      console.log(`🚀 Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", (err as Error).message);
    process.exit(1);
  }
}

startServer();
```

---

## 🧩 Additional Production Tips

| Recommendation                            | Description                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| 🧠 Use **Connection Pooling**             | Handled automatically by Mongoose, tuned above.                                |
| 🔐 Use **MongoDB SRV URIs + Credentials** | For cloud deployments (Atlas, Compose, etc.).                                  |
| 🛡️ Secure **Mongo Atlas IP Whitelist**    | Restrict connections by IP or VPC.                                             |
| 📈 Use **Monitoring Tools**               | e.g., MongoDB Atlas metrics or `mongoose.set('debug', true)` in staging.       |
| 🧾 Use **Indexes**                        | For query performance, but disable auto-indexing in prod to avoid startup lag. |
| ♻️ Deploy with **PM2 / Docker**           | Ensures restart-on-failure and load balancing.                                 |

---

## ✅ Final Output Example

When you run your app in production/staging:

```
✅ MongoDB connected [production]
🚀 Server running in production mode on port 8080
```

If DB is temporarily unavailable:

```
❌ MongoDB connection failed: getaddrinfo ENOTFOUND mongo
🔁 Retrying connection in 3s (4 attempts left)...
```

If DB shuts down mid-run:

```
⚠️ MongoDB disconnected. Attempting to reconnect...
🔄 MongoDB reconnected.
```

---

## 🎯 You Now Have:

- ✅ A **production-ready, self-healing MongoDB connection**
- ✅ Proper retry and graceful shutdown handling
- ✅ TypeScript-safe, clean code
- ✅ Performance and logging optimizations

---
