import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/custom-error";
import { JwtPayload, verifyAccessToken } from "../utils/jwt";
import * as jose from "jose";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // 1. Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw CustomError.Unauthorized("Access denied. No token provided.");
    }

    // 2. Verify the token
    const decoded = await verifyAccessToken(token);

    // 3 Ensure valid payload
    if (!decoded?.id || typeof decoded.id !== "string") {
      throw CustomError.Unauthorized("Invalid access token payload.");
    }

    // 4. Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
    } as JwtPayload;

    // 5. Optional dev log
    // if (process.env.NODE_ENV === "development") {
    //   console.log("Authenticated user:", req.user);
    // }

    next();
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      return next(CustomError.Unauthorized("Access token expired. Please refresh."));
    }
    if (error instanceof jose.errors.JWTInvalid) {
      return next(CustomError.Unauthorized("Invalid access token."));
    }
    next(error);
  }
};
