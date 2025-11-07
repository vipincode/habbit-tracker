import mongoose, { Schema, Document } from "mongoose";
import { IHabit } from "./habit.model";

export interface IEntry extends Document {
  habitId: IHabit["_id"];
  completionDate: Date;
  note?: string;
  createdAt: Date;
}

const entrySchema = new Schema<IEntry>(
  {
    habitId: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
    },
    completionDate: { type: Date, default: Date.now },
    note: { type: String },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export const Entry = mongoose.model<IEntry>("Entry", entrySchema);
