import express from "express"
import Order from "../models/Order.js"
import ArchivedOrder from "../models/ArchivedOrders.js"
import { requireAuth } from "../middleware/authMiddleware.js"

const router = express.Router()

function requireStaff(req, res, next) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" })
    const role = String(req.user.role || "").toLowerCase()
    if (role !== "staff" && role !== "admin") return res.status(403).json({ message: "Forbidden" })
    next()
}

function mapStatus(s) {
    const v = String(s || "").toUpperCase()
    if (v === "RECEIVED") return "RECEIVED"
    if (v === "IN_PROGRESS") return "IN_PROGRESS"
    if (v === "COMPLETED") return "READY"
    if (v === "CANCELED") return "CANCELED"
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
            qty: Number(it?.qty || 1),
            size: String(disp?.size || cfg?.size || order.size || ""),
            crust: String(disp?.crust || cfg?.crust || order.crust || ""),
            sauce: String(disp?.sauce || cfg?.sauce || order.sauce || ""),
            toppings: Array.isArray(tops) ? tops.map(String) : [],
            notes: String(it?.notes || ""),
        }
    })
}

function normalizeOrder(o) {
    return {
        _id: String(o._id),
        number: o.number ? String(o.number) : String(o._id),
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        customerName: String(o.customerName || "Guest"),
        timeLabel: isoTimeLabel(o.createdAt),
        status: mapStatus(o.status),
        items: normalizeItems(o),
        notes: String(o.notes || ""),
        total: Number(o.total || 0),
        kitchen: {
            items: Array.isArray(o.kitchen?.items) ? o.kitchen.items : [],
        },
        archivedAt: o.archivedAt || null,
        archivedBy: o.archivedBy || null,
    }
}

function defaultKitchenItem() {
    return {
        startedAt: null,
        startedBy: null,
        restartCount: 0,
        toppingIndex: 0,
        toppingDone: [],
        lastBackAtIndex: -1,
        ovenConfirmedAt: null,
        cookedConfirmedAt: null,
        backUsed: false,
        doneAt: null,
        canceledAt: null,
        canceledBy: null,
    }
}

function ensureKitchen(order) {
    const n = Array.isArray(order.items) ? order.items.length : 0
    order.kitchen = order.kitchen || {}
    order.kitchen.items = Array.isArray(order.kitchen.items) ? order.kitchen.items : []
    while (order.kitchen.items.length < n) {
        order.kitchen.items.push(defaultKitchenItem())
    }
    // if items were removed, trim extras
    if (order.kitchen.items.length > n) order.kitchen.items = order.kitchen.items.slice(0, n)
}

function recomputeOverallStatus(order) {
    const ks = Array.isArray(order.kitchen?.items) ? order.kitchen.items : []
    if (ks.length === 0) return "RECEIVED"

    const anyInProgress = ks.some(k => {
        return !!k.startedAt || Number(k.toppingIndex || 0) > 0 || !!k.ovenConfirmedAt || !!k.cookedConfirmedAt
    })

    const allFinished = ks.every(k => !!k.doneAt || !!k.canceledAt)

    if (allFinished) return "COMPLETED"
    if (anyInProgress) return "IN_PROGRESS"
    return "RECEIVED"
}

async function maybeArchive(order, req, res) {
    ensureKitchen(order)
    order.status = recomputeOverallStatus(order)

    const ks = order.kitchen.items
    const allFinished = ks.length > 0 && ks.every(k => !!k.doneAt || !!k.canceledAt)

    if (!allFinished) {
        await order.save()
        return res.json(normalizeOrder(order))
    }

    const obj = order.toObject()
    const originalId = String(order._id)
    delete obj._id

    await ArchivedOrder.create({
        ...obj,
        userId: obj.userId || null,
        status: "completed",
        originalOrderId: originalId,
        archivedAt: new Date(),
        archivedBy: req.user?.id || null,
    })


    await Order.deleteOne({ _id: originalId })
    return res.json({ moved: true })
}

/* =========================
   GET /api/staff/orders
   ?show=active|archived
========================= */
router.get("/", requireAuth, requireStaff, async (req, res) => {
    try {
        const show = String(req.query.show || "active").toLowerCase()

        if (show === "archived") {
            const archived = await ArchivedOrder.find({})
                .sort({ archivedAt: -1, createdAt: -1 })
                .limit(200)
            return res.json(archived.map((o, i) => ({ ...normalizeOrder(o), displayNumber: i + 1 })))
        }

        const orders = await Order.find({})
            .sort({ createdAt: 1 })
            .limit(200)

        res.json(orders.map((o, i) => ({ ...normalizeOrder(o), displayNumber: i + 1 })))
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch staff orders" })
    }
})

/* =========================
    PATCH /api/staff/orders/:id
    body: { itemIndex, status?, kitchen? }
========================= */
router.patch("/:id", requireAuth, requireStaff, async (req, res) => {
    try {
        const { id } = req.params
        const patch = req.body || {}

        const order = await Order.findById(id)
        if (!order) return res.status(404).json({ message: "Order not found" })

        ensureKitchen(order)

        const itemIndex = Number.isFinite(Number(patch.itemIndex)) ? Number(patch.itemIndex) : 0
        const n = Array.isArray(order.items) ? order.items.length : 0
        if (itemIndex < 0 || itemIndex >= n) return res.status(400).json({ message: "Invalid itemIndex" })

        const ki = order.kitchen.items[itemIndex] || defaultKitchenItem()

        // STATUS = per-suborder now
        if (patch.status !== undefined) {
            const s = String(patch.status).toUpperCase()
            let next = null
            if (s === "RECEIVED" || s === "PENDING") next = "RECEIVED"
            else if (s === "IN_PROGRESS") next = "IN_PROGRESS"
            else if (s === "DONE" || s === "READY" || s === "COMPLETED") next = "COMPLETED"
            else if (s === "CANCELED" || s === "CANCELLED") next = "CANCELED"
            else return res.status(400).json({ message: "Invalid status" })

            if (next === "RECEIVED") {
                // restart THIS suborder (reset to "not started" at step 0)
                const prevRestart = Number(ki.restartCount || 0)
                Object.assign(ki, defaultKitchenItem())
                ki.restartCount = prevRestart + 1

                // IMPORTANT: do NOT auto-start on restart
                ki.startedAt = null
                ki.startedBy = null
            }


            if (next === "IN_PROGRESS") {
                if (!ki.startedAt) ki.startedAt = new Date()
                if (!ki.startedBy) ki.startedBy = req.user?.id || null
            }

            if (next === "COMPLETED") {
                ki.doneAt = new Date()
                ki.canceledAt = null
                ki.canceledBy = null
            }

            if (next === "CANCELED") {
                ki.canceledAt = new Date()
                ki.canceledBy = req.user?.id || null
                ki.doneAt = null
            }
        }

        // Kitchen updates = per-suborder
        if (patch.kitchen && typeof patch.kitchen === "object") {
            const k = patch.kitchen

            // cooked already confirmed OR this request is confirming cooked
            const cookedNow =
                !!ki.cookedConfirmedAt &&
                k.cookedConfirmedAt !== null
            // explicit un-confirm
            if (k.cookedConfirmedAt === null) {
                ki.cookedConfirmedAt = null
                ki.ovenConfirmedAt = null
            }
            // non-navigation fields
            if (k.startedAt !== undefined) ki.startedAt = k.startedAt ? new Date(k.startedAt) : null
            if (k.startedBy !== undefined) ki.startedBy = k.startedBy || null
            if (k.restartCount !== undefined) ki.restartCount = Number(k.restartCount || 0)
            if (k.toppingDone !== undefined) ki.toppingDone = Array.isArray(k.toppingDone) ? k.toppingDone.map(v => !!v) : []
            if (k.ovenConfirmedAt !== undefined) ki.ovenConfirmedAt = k.ovenConfirmedAt ? new Date(k.ovenConfirmedAt) : null

            // if going BACK a step (and not cooked), clear oven/cooked so UI shows oven again
            if (!cookedNow && k.toppingIndex !== undefined) {
                const reqNext = Number(k.toppingIndex || 0)
                const prev = Number(ki.toppingIndex || 0)

                // max index based on toppingDone length (fallback 0)
                const max = Math.max(0, (Array.isArray(ki.toppingDone) ? ki.toppingDone.length : 0) - 1)

                // only allow moving 1 step forward per PATCH, and never past max
                let next = reqNext
                if (next > prev + 1) next = prev + 1
                if (next > max) next = max
                if (next < 0) next = 0

                // if staff goes back, undo oven/cooked confirmations
                if (next < prev) {
                    ki.ovenConfirmedAt = null
                    ki.cookedConfirmedAt = null
                    ki.lastBackAtIndex = -1
                    ki.backUsed = false
                }

                ki.toppingIndex = next
            }


            if (!cookedNow && k.lastBackAtIndex !== undefined) ki.lastBackAtIndex = Number(k.lastBackAtIndex || -1)
            if (!cookedNow && k.backUsed !== undefined) ki.backUsed = !!k.backUsed

            // cooked confirm LAST: lock nav + index
            if (k.cookedConfirmedAt !== undefined) {
                ki.cookedConfirmedAt = k.cookedConfirmedAt ? new Date(k.cookedConfirmedAt) : null
                const max = Math.max(0, (ki.toppingDone?.length || 0))
                ki.toppingIndex = max

                ki.lastBackAtIndex = -1
            }
        }

        order.kitchen.items[itemIndex] = ki

        // compute overall + archive only if ALL finished
        return await maybeArchive(order, req, res)
    } catch (e) {
        console.error("PATCH FAIL:", e)
        res.status(500).json({ message: e?.message || "Failed to patch order" })
    }
})

export default router
