import { env as loadEnv } from "custom-env";
import { z } from "zod";

// -------------------------------------------------------------
// 🧩 Set Default Stage
// -------------------------------------------------------------
process.env.APP_STAGE = process.env.APP_STAGE || "dev";

// -------------------------------------------------------------
// 🧠 Determine Environment
// -------------------------------------------------------------
const isProduction = process.env.APP_STAGE === "production";
const isStaging = process.env.APP_STAGE === "staging";
const isDevelopment = process.env.APP_STAGE === "dev";
const isTest = process.env.APP_STAGE === "test";

// -------------------------------------------------------------
// 📦 Load Environment Files (only for local/dev/test)
// -------------------------------------------------------------
if (isDevelopment) {
  loadEnv(); // loads `.env`
} else if (isTest) {
  loadEnv("test"); // loads `.env.test`
}
// (No .env loading for staging/production — handled by system envs)

// -------------------------------------------------------------
// 🧾 Environment Schema Validation
// -------------------------------------------------------------
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),

  APP_STAGE: z.enum(["dev", "staging", "production", "test"]).default("dev"),

  PORT: z
    .string()
    .default("4000")
    .transform(Number)
    .refine((val) => val > 0 && val < 65536, "PORT must be between 1 and 65535"),

  DATABASE_URL: z.string().startsWith("mongodb+srv://"),

  LOG_LEVEL: z
    .enum(["error", "warn", "info", "debug", "trace"])
    .default(isProduction || isStaging ? "info" : "debug"),

  API_KEY: z.string().optional(),

  // JWT & Auth
  ACCESS_TOKEN_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_SECRET: z.string().min(32).min(32, "JWT_SECRET must be at least 32 characters"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.string().optional(),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default("900000") // 15 minutes
    .transform(Number),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(20).default(12),

  // CORS
  CORS_ORIGIN: z
    .string()
    .or(z.array(z.string()))
    .transform((val) => {
      if (typeof val === "string") {
        return val.split(",").map((origin) => origin.trim());
      }
      return val;
    })
    .default([]),

  RATE_LIMIT_MAX_REQUESTS: z.string().default("100").transform(Number),

  RESEND_API_KEY: z.string(),
  FRONTEND_URL: z.string(),
  APP_NAME: z.string(),
});

export type EnvType = z.infer<typeof envSchema>;

// -------------------------------------------------------------
// ✅ Validate and Parse Environment
// -------------------------------------------------------------
let ENV: EnvType;

try {
  ENV = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("❌ Invalid environment variables:");
    const tree = z.treeifyError(error);
    console.error(JSON.stringify(tree, null, 2));

    // More detailed error messages
    error.issues.forEach((err) => {
      const path = err.path.join(".");
      console.error(`  ${path}: ${err.message}`);
    });

    process.exit(1);
  }
  throw error;
}

// -------------------------------------------------------------
// 🧠 Helper Functions
// -------------------------------------------------------------
export const isProd = () => ENV.NODE_ENV === "production";
export const isDev = () => ENV.NODE_ENV === "development";
export const isTestEnv = () => ENV.NODE_ENV === "test";
export const isStage = () => ENV.NODE_ENV === "staging";

// Grouped helpers
export const isProdLike = () => ENV.NODE_ENV === "production" || ENV.NODE_ENV === "staging";

// -------------------------------------------------------------
// 🚀 Exports
// -------------------------------------------------------------
export { ENV };
export default ENV;
