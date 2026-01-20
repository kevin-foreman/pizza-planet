import Topping from '../models/Topping.js'
import { asyncHandler } from '../utils/asyncHandler.js'
const DEFAULT_TOPPINGS = [
  { id: 'pep', name: 'Pepperoni', type: 'meat', price: 1.25, isAvailable: true, isPremium: false },
  { id: 'msh', name: 'Mushrooms', type: 'veg', price: 0.85, isAvailable: true, isPremium: false },
  { id: 'olv', name: 'Olives', type: 'veg', price: 0.85, isAvailable: true, isPremium: false },
  { id: 'on', name: 'Onions', type: 'veg', price: 0.65, isAvailable: true, isPremium: false },
  { id: 'gp', name: 'Green Peppers', type: 'veg', price: 0.75, isAvailable: true, isPremium: false },
  { id: 'ham', name: 'Ham', type: 'meat', price: 1.35, isAvailable: true, isPremium: true },
]

// GET /api/toppings
export const getAllToppings = asyncHandler(async (req, res) => {
  const count = await Topping.countDocuments({})
  if (count === 0) {
    await Topping.insertMany(DEFAULT_TOPPINGS)
  }
  const toppings = await Topping.find().sort({ name: 1 })
  res.json(toppings)
})


// PATCH /api/toppings/:id
export const updateTopping = asyncHandler(async (req, res) => {
  const { id } = req.params

  const update = {}

  if (req.body.price !== undefined) {
    const p = Number(req.body.price)
    if (!Number.isFinite(p) || p < 0) {
      return res.status(400).json({ message: 'Invalid price' })
    }
    update.price = p
  }

  if (req.body.isAvailable !== undefined) {
    update.isAvailable = !!req.body.isAvailable
  }

  if (req.body.isPremium !== undefined) {
    update.isPremium = !!req.body.isPremium
  }

  if (req.body.name !== undefined) {
    update.name = req.body.name
  }

  if (req.body.type !== undefined) {
    update.type = req.body.type
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' })
  }

  const topping = await Topping.findByIdAndUpdate(id, update, { new: true, runValidators: true })

  if (!topping) {
    return res.status(404).json({ message: 'Topping not found' })
  }

  res.json(topping)
})

// POST /api/toppings for seeding / admin
export const createTopping = asyncHandler(async (req, res) => {
  const { id, name, type, price, isPremium, isAvailable } = req.body

  if (!id) {
    return res.status(400).json({ message: 'Topping id is required (e.g. pep, msh, bac)' })
  }

  if (!name) {
    return res.status(400).json({ message: 'Topping name is required' })
  }

  try {
    const topping = await Topping.create({
      id,
      name,
      type,
      price,
      isPremium,
      isAvailable
    })

    res.status(201).json(topping)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: `There is already a topping with this id or name: ${id} / ${name}`
      })
    }
    throw err
  }
})

// DELETE /api/toppings/:id
export const deleteTopping = asyncHandler(async (req, res) => {
  const { id } = req.params

  const topping = await Topping.findByIdAndDelete(id)

  if (!topping) {
    return res.status(404).json({ message: 'Topping not found' })
  }

  res.json({ message: 'Deleted', id })
})
