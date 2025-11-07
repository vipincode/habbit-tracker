import { Schema, model, type Document } from "mongoose";

// Define the User interface
export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  password: string;
  role: "user" | "admin";
  refreshToken: String;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
    },
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    refreshToken: String,
  },
  { timestamps: true }
);

// Create and export the model
export const User = model<IUser>("User", userSchema);
