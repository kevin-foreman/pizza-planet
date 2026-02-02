import express from "express"
import Order from "../models/Order.js"
import Pricing from "../models/Pricing.js"
import { requireAuth } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/", requireAuth, async (req, res) => {

    try {
        const { customer, order } = req.body || {}

        if (!order?.items || order.items.length === 0) {
            return res.status(400).json({ error: "Cart is empty" })
        }

        const subtotal = Number(order.subtotal || 0)
        const tip = Number(order.tip || 0)

        const pricing = await Pricing.findOne({ key: "singleton" }).lean()
        const taxRate = Number(pricing?.taxRate || 0)

        const tax = +(subtotal * taxRate).toFixed(2)
        const total = +(subtotal + tip + tax).toFixed(2)

        const doc = await Order.create({
            userId: req.user.id,

            customerName: (customer?.name || "Guest").trim(),
            notes: (order.notes || "").trim(),
            deliveryNotes: (order.deliveryNotes || "").trim(),
            size: order.size || "Medium",
            crust: order.crust || "Hand Tossed",
            sauce: order.sauce || "Tomato",
            items: order.items.map(i => ({
                type: i.type || "item",
                name: i.name || i.label || i.title || "Item",
                qty: Number(i.qty || 1),
                unitPrice: Number(i.unitPrice || 0),
                display: i.display || {},
                config: i.config || {},
                notes: (i.notes || "").trim(),
                deliveryNotes: (i.deliveryNotes || "").trim(),
            })),

            subtotal,
            tip,
            tax,
            total,
            status: "RECEIVED",
            kitchen: { items: order.items.map(() => ({ toppingIndex: 0, toppingDone: [] })) },

        })

        return res.status(200).json({ ok: true, orderId: String(doc._id) })
    } catch (e) {
        console.error("POST /api/checkout failed:", e)
        res.status(500).json({ message: e?.message || String(e) })
    }
})

export default router
