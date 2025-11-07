import mongoose from "mongoose";
import { ENV, isProdLike } from "./env";

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  const options: mongoose.ConnectOptions = {
    autoIndex: !isProdLike, // disable auto-indexing in prod
    maxPoolSize: 10, // connection pool size
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000, // fail fast if DB is unreachable
    socketTimeoutMS: 45000, // close stale sockets
    connectTimeoutMS: 10000, // initial connection timeout
  };

  const connectWithRetry = async (retries = 5, delay = 3000): Promise<void> => {
    try {
      await mongoose.connect(ENV.DATABASE_URL, options);
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
