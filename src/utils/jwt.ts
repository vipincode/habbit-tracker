import { SignJWT, jwtVerify, JWTPayload } from "jose";
import ENV from "../config/env";
import { createSecretKey } from "crypto";

export interface JwtPayload {
  id: string;
  email?: string;
  username?: string;
  role?: string;
  [key: string]: unknown;
}

const accessSecretKey = createSecretKey(Buffer.from(ENV.ACCESS_TOKEN_SECRET, "utf-8"));
const refreshSecretKey = createSecretKey(Buffer.from(ENV.REFRESH_TOKEN_SECRET, "utf-8"));

export const signAccessToken = async (payload: JwtPayload) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.id) // by this user id exist in sub
    .setIssuedAt()
    .setExpirationTime(ENV.ACCESS_TOKEN_EXPIRES_IN || "15m")
    .sign(accessSecretKey);
};

export const signRefreshToken = async (payload: JwtPayload) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.id) // by this user id exist in sub
    .setIssuedAt()
    .setExpirationTime(ENV.REFRESH_TOKEN_EXPIRES_IN || "7d")
    .sign(refreshSecretKey);
};

export const verifyAccessToken = async (token: string) => {
  const { payload } = await jwtVerify(token, accessSecretKey);
  return payload as JWTPayload;
};

export const verifyRefreshToken = async (token: string) => {
  const { payload } = await jwtVerify(token, refreshSecretKey);
  return payload as JWTPayload;
};
