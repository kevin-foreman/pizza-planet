import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["customer", "staff", "admin"], default: "customer" },
    displayName: { type: String, default: "" },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

export default model("User", userSchema);
