import express from "express"
import Order from "../models/Order.js"
import ArchivedOrder from "../models/ArchivedOrders.js"
import Topping from "../models/Topping.js"
import { requireAuth } from "../middleware/authMiddleware.js"

const router = express.Router()

function isStaffUser(req) {
    const role = String(req.user?.role || "").toLowerCase()
    return role === "staff" || role === "admin"
}

function canAccess(req, order) {
    if (isStaffUser(req)) return true
    return String(order?.userId || "") === String(req.user?.id || "")
}

function pickToppingIdsFromItems(items) {
    const ids = new Set()
    for (const it of (items || [])) {
        const cfg = it?.config || {}
        const disp = it?.display || {}
        const tops = cfg?.toppings || disp?.toppings || []
        for (const t of (tops || [])) ids.add(String(t))
    }
    return [...ids]
}

async function makeToppingNameMapFromItems(items) {
    const ids = pickToppingIdsFromItems(items)
    if (ids.length === 0) return {}
    const rows = await Topping.find({ _id: { $in: ids } }).select("_id name").lean()
    return Object.fromEntries(rows.map(t => [String(t._id), t.name]))
}

function normalizeTrackPayload(doc, toppingNameById) {
    const items = Array.isArray(doc?.items) ? doc.items : []
    const kitchenItems = doc?.kitchen?.items || []

    return {
        orderId: String(doc._id),
        status: doc.status,
        updatedAt: doc.updatedAt,
        archivedAt: doc.archivedAt || null,

        size: doc.size,
        crust: doc.crust,
        sauce: doc.sauce,
        notes: doc.notes || "",

        subtotal: doc.subtotal,
        tax: doc.tax,
        tip: doc.tip,
        total: doc.total,

        items: items.map((it, i) => {
            const k = kitchenItems?.[i] || null
            const cfg = it?.config || {}
            const disp = it?.display || {}
            const tops = cfg?.toppings || disp?.toppings || []

            const toppingNames = (tops || []).map(
                t => toppingNameById[String(t)] || "Unknown"
            )

            return {
                name: it.name,
                qty: it.qty || 1,
                notes: it.notes || "",
                toppings: toppingNames,

                display: {
                    size: disp.size || "",
                    crust: disp.crust || "",
                    sauce: disp.sauce || "",
                    toppings: toppingNames,
                },

                config: cfg,
                kitchen: k,
            }
        }),

    }
}

/* Customers to track their order history from active + archived */
router.get("/mine", requireAuth, async (req, res) => {
    try {
        const uid = req.user.id
        const q = isStaffUser(req) ? {} : { userId: uid }

        const [active, archived] = await Promise.all([
            Order.find(q).sort({ createdAt: -1 }).limit(50).lean(),
            ArchivedOrder.find(q).sort({ archivedAt: -1, createdAt: -1 }).limit(50).lean(),
        ])

        const allItems = [...active.flatMap(o => o.items || []), ...archived.flatMap(o => o.items || [])]
        const toppingNameById = await makeToppingNameMapFromItems(allItems)

        function normalizeListRow(o, isArchived) {
            const items = Array.isArray(o.items) ? o.items : []
            return {
                orderId: String(isArchived ? (o.originalOrderId || o._id) : o._id),
                status: o.status,
                createdAt: o.createdAt,
                archivedAt: isArchived ? (o.archivedAt || null) : null,
                total: Number(o.total || 0),
                items: items.map(it => {
                    const cfg = it?.config || {}
                    const disp = it?.display || {}
                    const tops = cfg?.toppings || disp?.toppings || []
                    return {
                        name: it.name,
                        qty: it.qty || 1,
                        toppings: (tops || []).map(t => toppingNameById[String(t)] || "Unknown"),
                    }
                }),
            }
        }

        return res.json({
            active: active.map(o => normalizeListRow(o, false)),
            archived: archived.map(o => normalizeListRow(o, true)),
        })
    } catch (e) {
        console.error("GET /api/orders/mine failed:", e)
        return res.status(500).json({ message: "Failed to load order history" })
    }
})

/* Customers to see their Order Tracker (active OR archived) */
router.get("/:id/track", requireAuth, async (req, res) => {
    try {
        const id = req.params.id

        let doc = await Order.findById(id).lean()
        let isArchived = false

        if (!doc) {
            doc = await ArchivedOrder.findOne({ $or: [{ originalOrderId: id }, { _id: id }] }).lean()
            isArchived = true
        }

        if (!doc) return res.status(404).json({ message: "Not found" })
        if (!canAccess(req, doc)) return res.status(403).json({ message: "Forbidden" })

        const toppingNameById = await makeToppingNameMapFromItems(doc.items || [])
        const payload = normalizeTrackPayload(doc, toppingNameById)
        payload.isArchived = !!isArchived

        return res.json(payload)
    } catch (e) {
        console.error("GET /api/orders/:id/track failed:", e)
        return res.status(500).json({ message: "Failed to load tracking" })
    }
})

export default router
