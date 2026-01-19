import mongoose from 'mongoose'

const { Schema, model } = mongoose

const orderItemSchema = new Schema({
    toppingId: { type: Schema.Types.ObjectId, ref: 'Topping' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, default: 1 },
}, { _id: false })

const orderSchema = new Schema({
    customerName: { type: String, default: 'Guest' },
    notes: { type: String, default: '' },

    size: { type: String, required: true },
    crust: { type: String, required: true },
    sauce: { type: String, required: true },

    items: { type: [orderItemSchema], default: [] },

    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },

    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
}, { timestamps: true })

export default model('Order', orderSchema)
