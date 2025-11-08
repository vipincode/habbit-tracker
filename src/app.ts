import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { router } from "./routes/index";
import { notFoundHandler } from "./middlewares/not-found.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import { apiLimiter } from "./middlewares/rate-limit.middleware";

export const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("combined"));

// Hello world route
app.get("/", (req, res) => {
  res.json({ success: true, message: "Hello world!" });
});

// Apply global rate limiter (applies to all routes under /api)
app.use("/api", apiLimiter);

// Routes
app.use("/api", router);

// Not found
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);
