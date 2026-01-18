import Topping from '../models/Topping.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/toppings
export const getAllToppings = asyncHandler(async (req, res) => {
  const toppings = await Topping.find({ isAvailable: true }).sort({ name: 1 });
  res.json(toppings);
});

// POST /api/toppings for seeding / admin
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
// PATCH /api/toppings/:id 200 is passed by default
export const updateTopping = asyncHandler(async (req, res) => {
  const { id } = req.params
  const p = Number(req.body.price)

  if (!Number.isFinite(p) || p < 0) {
    return res.status(400).json({ message: 'Invalid price' })
  }

  const topping = await Topping.findByIdAndUpdate(
    id,
    { price: p },
    { new: true }
  )

  if (!topping) {
    return res.status(404).json({ message: 'Topping not found' })
  }

  res.json(topping)
})
