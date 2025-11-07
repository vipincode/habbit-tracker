import { Router } from "express";
import healthRouter from "./health.routes";
import authRouter from "./auth.route";

export const router = Router();

// router.use("/users", userRouter);
router.use("/health", healthRouter);
router.use("/auth", authRouter);
