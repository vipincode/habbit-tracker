import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import { router } from "./routes/index";
import { notFoundHandler } from "./middlewares/not-found";
import { errorHandler } from "./middlewares/error-handler";
import { apiLimiter } from "./middlewares/rate-limit";

export const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
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
