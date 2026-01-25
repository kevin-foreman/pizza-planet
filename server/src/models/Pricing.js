import mongoose from 'mongoose'
const { Schema, model } = mongoose

const optionSchema = new Schema({
    id: { type: String, required: true },
    label: { type: String, required: true },
    image: { type: String, default: "" },
}, { _id: false })

const sizeSchema = new Schema({
    id: { type: String, required: true },
    label: { type: String, required: true },
    mult: { type: Number, required: true },
    image: { type: String, default: "" },
}, { _id: false })

const pricingSchema = new Schema({
    key: { type: String, unique: true, default: "singleton" },
    basePrice: { type: Number, required: true, default: 10.99 },
    sizes: { type: [sizeSchema], default: [] },
    crusts: { type: [optionSchema], default: [] },
    sauces: { type: [optionSchema], default: [] },
    taxRate: { type: Number, default: 0 },
}, { timestamps: true })


export default model('Pricing', pricingSchema)
