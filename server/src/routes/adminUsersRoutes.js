import express from "express"
import User from "../models/User.js"
import { requireAuth, requireRole } from "../middleware/authMiddleware.js"


const r = express.Router()

r.get("/admin/users", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
        const users = await User.find({})
            .select("_id email displayName role roles isActive createdAt updatedAt")
            .sort({ createdAt: -1 })
        res.json({ users })
    } catch (e) {
        next(e)
    }
})

r.delete("/admin/users/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
        if (String(req.user?.id) === String(req.params.id)) {
            return res.status(400).json({ message: "You can’t delete your own account" })
        }

        const deleted = await User.findByIdAndDelete(req.params.id)
        if (!deleted) return res.status(404).json({ message: "User not found" })

        res.json({ ok: true })
    } catch (e) {
        next(e)
    }
})

r.patch("/admin/users/:id/role", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
        const { role } = req.body || {}
        if (!role || !["customer", "staff", "admin"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" })
        }

        // prevent self-demotion / self-lockout
        if (String(req.user?.id) === String(req.params.id)) {
            return res.status(400).json({ message: "You can’t change your own role" })
        }

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { role, roles: [role] },
            { new: true }
        ).select("_id email displayName role roles isActive createdAt updatedAt")

        if (!updated) return res.status(404).json({ message: "User not found" })
        res.json({ user: updated })
    } catch (e) {
        next(e)
    }
})

export default r
