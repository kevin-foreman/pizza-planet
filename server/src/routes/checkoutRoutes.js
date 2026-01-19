import express from "express"
import Order from "../models/Order.js"

const router = express.Router()

router.post("/checkout", async (req, res) => {
    try {
        const { customer, order } = req.body || {}

        if (!order?.items || order.items.length === 0) {
            return res.status(400).json({ error: "Cart is empty" })
        }

        const subtotal = Number(order.subtotal || 0)
        const tax = Number(order.tax || 0)
        const total = Number(order.total || subtotal + tax)

        const doc = await Order.create({
            customerName: (customer?.name || "Guest").trim(),
            notes: (order.notes || "").trim(),
            size: order.size || "medium",
            crust: order.crust || "regular",
            sauce: order.sauce || "red",
            items: order.items.map(i => ({
                toppingId: i.toppingId || i._id || undefined,
                name: i.name,
                price: Number(i.price || 0),
                qty: Number(i.qty || 1),
            })),
            subtotal,
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
