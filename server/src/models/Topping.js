import mongoose from "mongoose"
const { Schema, model } = mongoose

const toppingSchema = new Schema({
	id: { type: String, required: true, unique: true, trim: true, lowercase: true },
	name: { type: String, required: true, trim: true, unique: true },
	type: { type: String, enum: ["meat", "veggie", "cheese", "sauce", "other"], default: "other" },
	price: { type: Number, default: 0 },
	image: { type: String, default: "" },
	isAvailable: { type: Boolean, default: true },
	isPremium: { type: Boolean, default: false },
}, { timestamps: true })

export default model("Topping", toppingSchema)
