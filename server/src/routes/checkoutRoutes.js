import express from "express"
import Order from "../models/Order.js"
import Pricing from "../models/Pricing.js"

const router = express.Router()

router.post("/", async (req, res) => {
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
            customerName: (customer?.name || "Guest").trim(),
            notes: (order.notes || "").trim(),
            size: order.size || "Medium",
            crust: order.crust || "Hand Tossed",
            sauce: order.sauce || "Tomato",
            items: order.items.map(i => ({
                type: i.type || "item",
                name: i.name,
                qty: Number(i.qty || 1),
                unitPrice: Number(i.unitPrice || 0),
                display: i.display || null,
                config: i.config || null,
                notes: (i.notes || "").trim(),
            })),
            subtotal,
            tip,
            tax,
            total,
            status: "pending",
        })

        return res.status(200).json({ ok: true, orderId: String(doc._id) })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: "Checkout failed" })
    }
})

export default router
