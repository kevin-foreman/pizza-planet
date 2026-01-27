import 'dotenv/config'
import mongoose from 'mongoose'
import Pricing from './src/models/Pricing.js'

const DEFAULT_PRICING = {
    basePrice: 10.99,
    sizes: [
        { id: 'sm', label: 'Small', mult: 1 },
        { id: 'md', label: 'Medium', mult: 1.25 },
        { id: 'lg', label: 'Large', mult: 1.5 },
    ],
    crusts: [
        { id: 'thin', label: 'Thin' },
        { id: 'hand', label: 'Hand Tossed' },
        { id: 'pan', label: 'Pan' },
    ],
    sauces: [
        { id: 'red', label: 'Tomato' },
        { id: 'white', label: 'White Sauce' },
        { id: 'bbq', label: 'BBQ' },
    ],
    toppings: [
        { id: 'pep', label: 'Pepperoni', price: 1.25 },
        { id: 'msh', label: 'Mushrooms', price: 0.85 },
        { id: 'olv', label: 'Olives', price: 0.85 },
        { id: 'on', label: 'Onions', price: 0.65 },
        { id: 'gp', label: 'Green Peppers', price: 0.75 },
        { id: 'ham', label: 'Ham', price: 1.35 },
    ],
    taxRate: await Pricing.findOneAndUpdate(
        { key: "singleton" },
        { $set: { ...DEFAULT_PRICING, key: "singleton" } },
        { upsert: true, new: true }
    ),
}

async function main() {
    await mongoose.connect(process.env.MONGO_URI)
    await Pricing.findOneAndUpdate(
        {},
        { $set: DEFAULT_PRICING },
        { upsert: true, new: true }
    )

    await mongoose.disconnect()
}

main().catch(e => {
    console.error(e)
    process.exit(1)
})
