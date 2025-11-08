import rateLimit from "express-rate-limit";
import { ENV } from "../config/env.js";

// Default values (can be tuned via environment)
const windowMs = ENV.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000; // 15 minutes
const maxRequests = ENV.RATE_LIMIT_MAX_REQUESTS || 100; // 100 requests per IP per window

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
