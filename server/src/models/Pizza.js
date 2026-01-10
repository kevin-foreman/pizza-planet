import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const pizzaSchema = new Schema(
  {
    pizzaName: {
      type: String,
      required: true,
      trim: true
    },
    size: {
      type: String,
      enum: ['personal', 'small', 'medium', 'large', 'xl'],
      default: 'medium'
    },
    crust: {
      type: String,
      enum: ['thin', 'regular', 'deep-dish', 'stuffed'],
      default: 'regular'
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
      type: String, // later this could be a User ref
      default: 'guest'
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'in-kitchen', 'ready', 'completed', 'cancelled'],
      default: 'draft'
    },
    totalPrice: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Pizza = model('Pizza', pizzaSchema);

export default Pizza;