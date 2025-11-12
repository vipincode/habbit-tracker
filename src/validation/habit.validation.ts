import { z } from "zod";

export const habitSchema = z.object({
  name: z.string().min(3, "Minimum three letter required"),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  targetCount: z.coerce.number().positive("Target count must be positive"),
});

export type habitInputType = z.infer<typeof habitSchema>;
