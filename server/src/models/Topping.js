import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const toppingSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    type: {
      type: String,
      enum: ['meat', 'veg', 'cheese', 'sauce', 'other'],
      default: 'other'
    },
    price: {
      type: Number,
      default: 0
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    isPremium: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Topping = model('Topping', toppingSchema);

export default Topping;