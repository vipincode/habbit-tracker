import { Schema, model, type Document } from "mongoose";

// Define the User interface
export interface IUser extends Document {
  _id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  role: "user" | "admin";
  refreshToken: String | null;
  isVerified: boolean;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    verificationTokenExpires: { type: Date, default: null },
    refreshToken: { type: String, default: null },
  },
  { timestamps: true }
);

// Create and export the model
export const User = model<IUser>("User", userSchema);
