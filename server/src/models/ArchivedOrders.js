import mongoose from "mongoose"

const { Schema, model } = mongoose

const orderItemSchema = new Schema({
    type: { type: String, default: "item" },
    name: { type: String, required: true },
    qty: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    display: { type: Schema.Types.Mixed, default: null },
    config: { type: Schema.Types.Mixed, default: null },
    notes: { type: String, default: "" },
}, { _id: false })

const archivedOrderSchema = new Schema({
    // copy of Order fields
    customerName: { type: String, default: "Guest" },
    notes: { type: String, default: "" },

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
        enum: ["pending", "in_progress", "completed", "canceled"],
        default: "pending"
    },

    // archive metadata
    archivedAt: { type: Date, default: null },
    archivedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    // keep kitchen if you want history
    kitchen: {
        startedAt: { type: Date, default: null },
        startedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        restartCount: { type: Number, default: 0 },
        toppingIndex: { type: Number, default: 0 },
        toppingDone: { type: [Boolean], default: [] },
        ovenConfirmedAt: { type: Date, default: null },
        cookedConfirmedAt: { type: Date, default: null },
        backUsed: { type: Boolean, default: false },
    },

    originalOrderId: { type: String, default: "" },
}, { timestamps: true })

export default model("ArchivedOrder", archivedOrderSchema, "archived_orders")
