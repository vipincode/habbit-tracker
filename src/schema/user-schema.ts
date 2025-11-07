import { z } from "zod";

const userBaseSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters long").trim(),
    username: z.string().min(1, "Username is required").trim(),
    email: z.email("Please provide a valid email").transform((s) => s.toLowerCase().trim()),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    role: z.enum(["user", "admin"]).default("user"),
    refreshToken: z.string().optional(),
    createdAt: z.preprocess((v) => (v ? new Date(v as string) : undefined), z.date()).optional(),
    updatedAt: z.preprocess((v) => (v ? new Date(v as string) : undefined), z.date()).optional(),
  })
  .strict();

export const createUserSchema = userBaseSchema.omit({ createdAt: true, updatedAt: true });

export const updateUserSchema = userBaseSchema
  .omit({ password: true, createdAt: true, updatedAt: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const loginUserSchema = z.object({
  email: z.email("Please provide a valid email").transform((s) => s.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
