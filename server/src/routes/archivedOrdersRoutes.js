//routes/archivedOrdersRoutes.js
import express from "express"
import ArchivedOrder from "../models/ArchivedOrders.js"

const router = express.Router()

router.get("/random", async (req, res) => {
    try {
        const limit = Math.max(1, Math.min(parseInt(req.query.limit || "10", 10), 15))

        const docs = await ArchivedOrder.aggregate([
            { $match: { items: { $exists: true, $ne: [] } } },
            { $sample: { size: limit } },
            {
                $project: {
                    customerName: 1,
                    items: 1,
                    createdAt: 1,
                    archivedAt: 1
                }
            }
        ])

        res.json(docs)
    } catch (e) {
        res.status(500).json({ error: "archived_orders_failed" })
    }
})

export default router
