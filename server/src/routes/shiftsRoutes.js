import express from 'express'
import Shift from '../models/Shift.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/status', requireAuth, async (req, res) => {
    const userId = req.user.id
    const active = await Shift.findOne({ userId, clockOutAt: null })
    res.json({ isClockedIn: !!active, activeShift: active })
})

router.get('/me/summary', requireAuth, async (req, res) => {
    const userId = req.user.id

    const shifts = await Shift.find({ userId }).sort({ clockInAt: -1 })

    let totalMs = 0
    for (const s of shifts) {
        const start = new Date(s.clockInAt).getTime()
        const end = s.clockOutAt ? new Date(s.clockOutAt).getTime() : Date.now()
        if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
            totalMs += end - start
        }
    }

    res.json({
        userId,
        shiftCount: shifts.length,
        totalMs
    })
})

router.post('/clock-in', requireAuth, async (req, res) => {
    const userId = req.user.id
    const existing = await Shift.findOne({ userId, clockOutAt: null })
    if (existing) return res.status(400).json({ message: 'Already clocked in' })
    const shift = await Shift.create({ userId, clockInAt: new Date() })
    res.json({ ok: true, shift })
})

router.post('/clock-out', requireAuth, async (req, res) => {
    const userId = req.user.id
    const active = await Shift.findOne({ userId, clockOutAt: null })
    if (!active) return res.status(400).json({ message: 'Not clocked in' })
    active.clockOutAt = new Date()
    await active.save()
    res.json({ ok: true, shift: active })
})

export default router
