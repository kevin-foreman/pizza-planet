import mongoose from 'mongoose'

const TipShareSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true, index: true },
    tipCents: { type: Number, required: true },
    at: { type: Date, required: true, index: true },
}, { timestamps: true })

TipShareSchema.index({ userId: 1, at: -1 })

export default mongoose.model('TipShare', TipShareSchema)
