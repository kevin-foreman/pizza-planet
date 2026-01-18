import express from 'express';

import {
  getAllToppings,
  createTopping
} from '../controllers/toppingController.js';
import { updateTopping } from '../controllers/toppingController.js'

const router = express.Router();

// GET /api/toppings
router.get('/', getAllToppings);
// POST /api/toppings  (optional: for seeding/admin)
router.post('/', createTopping);
// PATCH /api/toppings/:id
router.patch('/:id', updateTopping)

export default router;