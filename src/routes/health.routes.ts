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
