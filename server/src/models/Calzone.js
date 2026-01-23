import mongoose from 'mongoose'

const { Schema, model } = mongoose

const calzoneSchema = new Schema(
	{
		calzoneName: {
			type: String,
			required: true,
			trim: true
		},
		toppings: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Topping'
			}
		],
		specialInstructions: {
			type: String,
			trim: true
		},
		createdBy: {
			type: String,
			default: 'guest'
		},
		status: {
			type: String,
			enum: ['draft', 'pending', 'in-kitchen', 'ready', 'completed', 'canceled'],
			default: 'draft'
		},
		totalPrice: {
			type: Number,
			default: 0
		},
		isAvailable: {
			type: Boolean,
			default: true
		}
	},
	{ timestamps: true }
)

const Calzone = model('Calzone', calzoneSchema)

export default Calzone
