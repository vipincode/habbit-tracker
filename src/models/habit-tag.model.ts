import mongoose, { Schema, Document } from "mongoose";
import { IHabit } from "./habit.model";
import { ITag } from "./tag.model";

export interface IHabitTag extends Document {
  habitId: IHabit["_id"];
  tagId: ITag["_id"];
  createdAt: Date;
}

const habitTagSchema = new Schema<IHabitTag>(
  {
    habitId: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
    },
    tagId: {
      type: Schema.Types.ObjectId,
      ref: "Tag",
      required: true,
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

// Prevent duplicate (habitId, tagId) pairs
habitTagSchema.index({ habitId: 1, tagId: 1 }, { unique: true });

export const HabitTag = mongoose.model<IHabitTag>("HabitTag", habitTagSchema);
