import ENV from "../config/env";

export const cookieOptions = () => {
  const isProd = ENV.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ("none" as const) : ("lax" as const),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
    domain: ENV.COOKIE_DOMAIN || undefined,
  };
};
