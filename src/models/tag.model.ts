import mongoose, { Schema, Document } from "mongoose";

export interface ITag extends Document {
  name: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const tagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    color: {
      type: String,
      default: "#6B7280",
      match: /^#([A-Fa-f0-9]{6})$/, // Validate hex color
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

export const Tag = mongoose.model<ITag>("Tag", tagSchema);
