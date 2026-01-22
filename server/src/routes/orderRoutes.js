import express from "express"
import Order from "../models/Order.js"
import { requireAuth } from "../middleware/authMiddleware.js"

const router = express.Router()

function requireStaff(req, res, next) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" })
    const role = String(req.user.role || "").toLowerCase()
    if (role !== "staff" && role !== "admin") return res.status(403).json({ message: "Forbidden" })
    next()
}


function mapStatus(s) {
    const v = String(s || "").toLowerCase()
    if (v === "pending") return "RECEIVED"
    if (v === "in_progress") return "IN_PROGRESS"
    if (v === "completed") return "READY"
    if (v === "cancelled") return "CANCELLED"
    return "RECEIVED"
}

function isoTimeLabel(d) {
    try {
        const dt = new Date(d)
        if (!Number.isFinite(dt.getTime())) return ""
        return dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    } catch (e) {
        return ""
    }
}

function normalizeItems(order) {
    const items = Array.isArray(order.items) ? order.items : []
    return items.map(it => {
        const cfg = it?.config || {}
        const disp = it?.display || {}
        const tops = cfg?.toppings || disp?.toppings || []
        return {
            type: String(it?.type || "Item"),
            size: String(disp?.size || cfg?.size || order.size || ""),
            crust: String(disp?.crust || cfg?.crust || order.crust || ""),
            sauce: String(disp?.sauce || cfg?.sauce || order.sauce || ""),
            toppings: Array.isArray(tops) ? tops.map(String) : [],
            notes: String(it?.notes || "")
        }
    })
}

function normalizeOrder(o) {
    return {
        _id: String(o._id),
        number: o.number ? String(o.number) : String(o._id),
        customerName: String(o.customerName || "Guest"),
        timeLabel: isoTimeLabel(o.createdAt),
        status: mapStatus(o.status),
        items: normalizeItems(o),
        notes: String(o.notes || ""),
        total: Number(o.total || 0),
        kitchen: {
            startedAt: o.kitchen?.startedAt || null,
            startedBy: o.kitchen?.startedBy || null,
            restartCount: Number(o.kitchen?.restartCount || 0),
            toppingIndex: Number(o.kitchen?.toppingIndex || 0),
            toppingDone: Array.isArray(o.kitchen?.toppingDone) ? o.kitchen.toppingDone : []
        }
    }
}

router.get("/", requireAuth, requireStaff, async (req, res) => {
    try {
        const orders = await Order.find({ archived: false }).sort({ createdAt: 1 }).limit(200)
        res.json(orders.map(normalizeOrder))
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch staff orders" })
    }
})

router.patch("/:id", requireAuth, requireStaff, async (req, res) => {
    try {
        const { id } = req.params
        const patch = req.body || {}

        const order = await Order.findById(id)
        if (!order) return res.status(404).json({ message: "Order not found" })

        if (patch.status) {
            const s = String(patch.status)
            if (s === "RECEIVED") order.status = "pending"
            if (s === "IN_PROGRESS") order.status = "in_progress"
            if (s === "READY") order.status = "completed"
            if (s === "CANCELLED") order.status = "cancelled"
        }

        if (patch.kitchen && typeof patch.kitchen === "object") {
            order.kitchen = order.kitchen || {}
            const k = patch.kitchen

            if (k.startedAt !== undefined) order.kitchen.startedAt = k.startedAt ? new Date(k.startedAt) : null
            if (k.startedBy !== undefined) order.kitchen.startedBy = k.startedBy || null
            if (k.restartCount !== undefined) order.kitchen.restartCount = Number(k.restartCount || 0)
            if (k.toppingIndex !== undefined) order.kitchen.toppingIndex = Number(k.toppingIndex || 0)
            if (k.toppingDone !== undefined) order.kitchen.toppingDone = Array.isArray(k.toppingDone) ? k.toppingDone.map(v => !!v) : []
        }

        await order.save()
        res.json(normalizeOrder(order))
    } catch (e) {
        res.status(500).json({ message: "Failed to patch order" })
    }
})

export default router
