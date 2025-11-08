import crypto from "crypto";

/**
 * Generate a secure random token and its hashed version.
 */
export const generateSecureToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, hashedToken };
};

/**
 * Hash a token (e.g., one received from user in query params)
 */
export const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
