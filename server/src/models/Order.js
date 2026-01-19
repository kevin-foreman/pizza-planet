import mongoose from 'mongoose'

const { Schema, model } = mongoose

const orderItemSchema = new Schema({
    type: { type: String, default: 'item' },
    name: { type: String, required: true },
    qty: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    display: { type: Schema.Types.Mixed, default: null },
    config: { type: Schema.Types.Mixed, default: null },
    notes: { type: String, default: '' },
}, { _id: false })


const orderSchema = new Schema({
    customerName: { type: String, default: 'Guest' },
    notes: { type: String, default: '' },

    size: { type: String },
    crust: { type: String },
    sauce: { type: String },

    items: { type: [orderItemSchema], default: [] },

    subtotal: { type: Number, required: true },
    tip: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },

    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
}, { timestamps: true })


export default model('Order', orderSchema)
