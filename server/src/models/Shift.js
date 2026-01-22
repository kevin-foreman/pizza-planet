import mongoose from 'mongoose'

const ShiftSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clockInAt: { type: Date, required: true, index: true },
    clockOutAt: { type: Date, default: null, index: true },
}, { timestamps: true })

ShiftSchema.index({ userId: 1, clockOutAt: 1 })

export default mongoose.model('Shift', ShiftSchema)
