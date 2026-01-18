import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  return jwt.sign(
    { id: user._id.toString(), email: user.email, roles: [user.role] },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// POST /api/auth/signup
router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, displayName, role } = req.body;

    if (!email || !password) {
      const err = new Error("Email and password are required");
      err.statusCode = 400;
      throw err;
    }
    if (password.length < 8) {
      const err = new Error("Password must be at least 8 characters");
      err.statusCode = 400;
      throw err;
    }

    // Safer default: do NOT let public signup create admin.
    // If you want to allow staff/admin during demo, change this logic.
    const safeRole = "customer";

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      const err = new Error("Account already exists");
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      role: safeRole,
      displayName: displayName || "",
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: { id: user._id, email: user.email, role: user.role, displayName: user.displayName },
    });
  } catch (e) {
    // Handle duplicate unique collisions
    if (e?.code === 11000) {
      return res.status(409).json({ message: "Account already exists" });
    }
    return next(e);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error("Email and password are required");
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      const err = new Error("Invalid credentials");
      err.statusCode = 401;
      throw err;
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      const err = new Error("Invalid credentials");
      err.statusCode = 401;
      throw err;
    }

    const token = signToken(user);

    return res.json({
      token,
      user: { id: user._id, email: user.email, role: user.role, displayName: user.displayName },
    });
  } catch (e) {
    return next(e);
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("_id email role displayName");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user: { id: user._id, email: user.email, role: user.role, displayName: user.displayName } });
  } catch (e) {
    return next(e);
  }
});

export default router;
