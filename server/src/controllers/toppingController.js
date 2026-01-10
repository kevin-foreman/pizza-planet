import Topping from '../models/Topping.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/toppings
export const getAllToppings = asyncHandler(async (req, res) => {
  const toppings = await Topping.find({ isAvailable: true }).sort({ name: 1 });
  res.json(toppings);
});

// (Optional) POST /api/toppings for seeding / admin
export const createTopping = asyncHandler(async (req, res) => {
  const { name, type, price, isAvailable, isPremium } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Topping name is required' });
  }

  const topping = await Topping.create({
    name,
    type,
    price,
    isAvailable,
    isPremium
  });

  res.status(201).json(topping);
});