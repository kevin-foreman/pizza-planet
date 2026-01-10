import express from 'express';
import {
  createPizza,
  getPizzas
} from '../controllers/pizzaController.js';

const router = express.Router();

// POST /api/pizzas
router.post('/', createPizza);

// GET /api/pizzas (optional)
router.get('/', getPizzas);

export default router;