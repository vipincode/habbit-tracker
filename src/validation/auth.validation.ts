import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long").trim(),
  username: z.string().min(1, "Username is required").trim(),
  email: z.email("Please provide a valid email").transform((s) => s.toLowerCase().trim()),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const loginSchema = z.object({
  email: z.email("Please provide a valid email").transform((s) => s.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailQuerySchema = z.object({
  token: z.string().min(1, "Verification token cannot be empty"),
});

export type RegisterUserInput = z.infer<typeof registerSchema>;
export type LoginUserInput = z.infer<typeof loginSchema>;
