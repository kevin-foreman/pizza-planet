import Pizza from '../models/Pizza.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// POST /api/pizzas
export const createPizza = asyncHandler(async (req, res) => {
  const {
    pizzaName,
    size,
    crust,
    toppings, // array of topping IDs
    specialInstructions,
    createdBy
  } = req.body;

  if (!pizzaName || !size || !crust) {
    return res.status(400).json({
      message: 'pizzaName, size, and crust are required'
    });
  }

  const pizza = await Pizza.create({
    pizzaName,
    size,
    crust,
    toppings: toppings || [],
    specialInstructions,
    createdBy
  });

  // Optional: populate toppings before returning
  await pizza.populate('toppings');

  res.status(201).json(pizza);
});

// (Optional) GET /api/pizzas for debugging / admin
export const getPizzas = asyncHandler(async (req, res) => {
  const pizzas = await Pizza.find().populate('toppings').sort({ createdAt: -1 });
  res.json(pizzas);
});