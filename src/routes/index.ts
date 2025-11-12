import { Router } from "express";
import healthRouter from "./health.routes";
import authRouter from "./auth.route";
import habitsRouter from "./habit.routes";

export const router = Router();

// router.use("/users", userRouter);
router.use("/health", healthRouter);
router.use("/auth", authRouter);

// Habits
router.use("/habits", habitsRouter);
