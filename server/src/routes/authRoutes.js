import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { requireAuth } from "../middleware/authMiddleware.js"

const router = express.Router()

function isStrongPassword(pw) {
  if (typeof pw !== "string") return false
  if (pw.length < 8) return false

  const upper = (pw.match(/[A-Z]/g) || []).length
  const lower = (pw.match(/[a-z]/g) || []).length
  const numbers = (pw.match(/[0-9]/g) || []).length
  const special = (pw.match(/[^A-Za-z0-9]/g) || []).length

  return upper >= 2 && lower >= 2 && numbers >= 2 && special >= 2
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidDisplayName(name) {
  return /^[a-zA-Z0-9._-]{3,30}$/.test(name)
}

function signToken(user) {
  const secret = process.env.JWT_SECRET
  return jwt.sign(
    { id: user._id.toString(), email: user.email, roles: [user.role] },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  )
}

// POST /api/auth/signup
router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body

    if (!email || !password) {
      const err = new Error("Email and password are required")
      err.statusCode = 400
      throw err
    }

    const cleanEmail = String(email || "").toLowerCase().trim()

    if (!isValidEmail(cleanEmail)) {
      const err = new Error("Email is not valid")
      err.statusCode = 400
      throw err
    }

    const cleanName = String(displayName || "").trim()

    if (cleanName && !isValidDisplayName(cleanName)) {
      const err = new Error("Username must be 3-30 chars and only use letters, numbers, . _ -")
      err.statusCode = 400
      throw err
    }

    if (!isStrongPassword(password)) {
      const err = new Error(
        "Password must be at least 8 characters and include 2 uppercase, 2 lowercase, 2 numbers, and 2 special characters"
      )
      err.statusCode = 400
      throw err
    }

    // Default for first account to be admin.
    const isFirst = (await User.countDocuments({})) === 0
    const safeRole = isFirst ? "admin" : "customer"


    const existing = await User.findOne({ email: cleanEmail })
    if (existing) {
      return res.status(409).json({ message: "E-mail already exists" })
    }


    const passwordHash = await bcrypt.hash(password, 12)

    const user = await User.create({
      email: cleanEmail,
      passwordHash,
      role: safeRole,
      displayName: cleanName,
    })

    const token = signToken(user)

    return res.status(201).json({
      token,
      user: { id: user._id, email: user.email, role: user.role, displayName: user.displayName },
    })
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ message: "Account already exists" })
    }
    return next(e)
  }
})

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      const err = new Error("Email and password are required")
      err.statusCode = 400
      throw err
    }

    const cleanEmail = String(email || "").toLowerCase().trim()

    const user = await User.findOne({ email: cleanEmail })
    if (!user) {
      const err = new Error("Invalid credentials")
      err.statusCode = 401
      throw err
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      const err = new Error("Invalid credentials")
      err.statusCode = 401
      throw err
    }

    const token = signToken(user)

    return res.json({
      token,
      user: { id: user._id, email: user.email, role: user.role, displayName: user.displayName },
    })
  } catch (e) {
    return next(e)
  }
})

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("_id email role displayName")
    if (!user) return res.status(404).json({ message: "User not found" })
    return res.json({ user: { id: user._id, email: user.email, role: user.role, displayName: user.displayName } })
  } catch (e) {
    return next(e)
  }
})

export default router
