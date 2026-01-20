import Topping from '../models/Topping.js'
import { asyncHandler } from '../utils/asyncHandler.js'
const DEFAULT_TOPPINGS = [
  { id: 'pep', name: 'Pepperoni', type: 'meat', price: 1.25, isAvailable: true, isPremium: false },
  { id: 'msh', name: 'Mushrooms', type: 'veggie', price: 0.85, isAvailable: true, isPremium: false },
  { id: 'olv', name: 'Olives', type: 'veggie', price: 0.85, isAvailable: true, isPremium: false },
  { id: 'on', name: 'Onions', type: 'veggie', price: 0.65, isAvailable: true, isPremium: false },
  { id: 'gp', name: 'Green Peppers', type: 'veggie', price: 0.75, isAvailable: true, isPremium: false },
  { id: 'ham', name: 'Ham', type: 'meat', price: 1.35, isAvailable: true, isPremium: true },
]

// GET /api/toppings
export const getAllToppings = asyncHandler(async (req, res) => {
  const count = await Topping.countDocuments({})
  if (count === 0) {
    await Topping.insertMany(DEFAULT_TOPPINGS, { ordered: false })
  }
  const toppings = await Topping.find().sort({ name: 1 })
  res.json(toppings)
})



// PATCH /api/toppings/:id
export const updateTopping = asyncHandler(async (req, res) => {
  const { id } = req.params
  const topping = await Topping.findByIdAndUpdate(id, {
    $set: {
      isAvailable: req.body.isAvailable,
    },
  }, { new: true })
  if (!topping) return res.status(404).json({ message: "Topping not found" })
  res.json(topping)
})


// POST /api/toppings for seeding / admin
function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function uniqueIdFromName(name) {
  let base = slugify(name)
  if (!base) base = 'topping'
  let id = base
  let n = 2
  while (await Topping.exists({ id })) {
    id = `${base}-${n}`
    n++
  }
  return id
}

export const createTopping = asyncHandler(async (req, res) => {
  let { id, name, type, price, isPremium, isAvailable } = req.body

  if (!name) {
    return res.status(400).json({ message: 'Topping name is required' })
  }

  if (!id) {
    id = await uniqueIdFromName(name)
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
  if (!topping) return res.status(404).json({ message: 'Topping not found' })
  res.json({ message: 'Deleted', id })
})
