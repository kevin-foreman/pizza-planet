import express from 'express'
import Order from '../models/Order.js'

const router = express.Router()

router.post('/', async (req, res) => {
    try {
        const {
            customerName,
            notes,
            size,
            crust,
            sauce,
            items,
            subtotal,
            tax,
            total
        } = req.body

        if (!size || !crust || !sauce) return res.status(400).json({ message: 'Missing pizza fields' })
        if (typeof subtotal !== 'number' || typeof total !== 'number') return res.status(400).json({ message: 'Missing totals' })

        const order = await Order.create({
            customerName,
            notes,
            size,
            crust,
            sauce,
            items: Array.isArray(items) ? items : [],
            subtotal,
            tax: typeof tax === 'number' ? tax : 0,
            total
        })

        return res.status(201).json({ orderId: order._id })
    } catch (err) {
        return res.status(500).json({ message: 'Failed to create order' })
    }
})

router.get('/', async (req, res) => {
    try {
        const { status } = req.query
        const q = {}
        if (status) q.status = status
        const orders = await Order.find(q).sort({ createdAt: -1 }).limit(50)
        return res.json(orders)
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch orders' })
    }
})

router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body
        const allowed = ['pending', 'in_progress', 'completed', 'cancelled']
        if (!allowed.includes(status)) return res.status(400).json({ message: 'Bad status' })
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true })
        if (!order) return res.status(404).json({ message: 'Not found' })
        return res.json(order)
    } catch (err) {
        return res.status(500).json({ message: 'Failed to update status' })
    }
})

export default router
