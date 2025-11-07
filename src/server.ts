import { app } from "./app";
import { ENV } from "./config/env";
import { connectDB } from "./config/db";

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
