import type { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/custom-error";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Default values
  let statusCode = 500;
  let message = "Internal Server Error";

  if (err instanceof CustomError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  // Log errors only for non-operational (unexpected) ones
  if (!(err instanceof CustomError)) {
    console.error("💥 Unhandled Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}
