import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./user.model";

export interface IHabit extends Document {
  userId: IUser["_id"];
  name: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly";
  targetCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const habitSchema = new Schema<IHabit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    frequency: {
      type: String,
      required: true,
      enum: ["daily", "weekly", "monthly"],
    },
    targetCount: { type: Number, default: 1, min: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

export const Habit = mongoose.model<IHabit>("Habit", habitSchema);
