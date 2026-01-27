import Topping from '../models/Topping.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import fs from "fs/promises"

import path from "path"

export const DEFAULT_TOPPINGS = [
  { id: "pep", name: "Pepperoni", type: "meat", price: 1.25, isAvailable: true, isPremium: true, image: "/Sprites/Toppings/Pepperoni.webp" },
  { id: "msh", name: "Mushrooms", type: "veggie", price: 0.85, isAvailable: true, isPremium: false, image: "/Sprites/Toppings/Mushrooms.webp" },
  { id: "olv", name: "Olives", type: "veggie", price: 0.85, isAvailable: true, isPremium: false, image: "/Sprites/Toppings/Olives.webp" },
  { id: "on", name: "Onions", type: "veggie", price: 0.65, isAvailable: true, isPremium: false, image: "/Sprites/Toppings/Onions.webp" },
  { id: "gp", name: "Green Peppers", type: "veggie", price: 0.75, isAvailable: true, isPremium: false, image: "/Sprites/Toppings/GreenPeppers.webp" },
  { id: "ham", name: "Ham", type: "meat", price: 1.35, isAvailable: true, isPremium: true, image: "/Sprites/Toppings/Ham.webp" },
]
function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function uniqueIdFromName(name) {
  let base = slugify(name)
  if (!base) base = "topping"
  let id = base
  let n = 2
  while (await Topping.exists({ id })) {
    id = `${base}-${n}`
    n++
  }
  return id
}

export const getAllToppings = asyncHandler(async (req, res) => {
  const count = await Topping.countDocuments({})
  if (count === 0) {
    try {
      await Topping.insertMany(DEFAULT_TOPPINGS, { ordered: false })
    } catch (e) {
      if (e?.code !== 11000) throw e
    }
  }

  const showAll = req.query.all === "1" || req.query.includeDisabled === "true"
  const filter = showAll ? {} : { isAvailable: true }

  const toppings = await Topping.find(filter).sort({ name: 1 })
  res.json(toppings)
})


export const updateTopping = asyncHandler(async (req, res) => {
  const { id } = req.params
  const $set = {}

  if (req.body.isAvailable !== undefined) {
    $set.isAvailable = String(req.body.isAvailable).toLowerCase() === "true"
  }

  if (req.body.price !== undefined) $set.price = Number(req.body.price) || 0

  if (req.body.image !== undefined) $set.image = String(req.body.image || "")

  if ($set.isAvailable === true) {
    const current = await Topping.findById(id).lean()
    if (!current) return res.status(404).json({ message: "Topping not found" })
    const nextImage = $set.image !== undefined ? $set.image : current.image
    if (!nextImage) {
      return res.status(400).json({ message: "Cannot enable a topping without an image" })
    }
  }

  const topping = await Topping.findByIdAndUpdate(id, { $set }, { new: true, runValidators: true })
  if (!topping) return res.status(404).json({ message: "Topping not found" })
  res.json(topping)
})


// CREATE /api/toppings/:id
export const createTopping = asyncHandler(async (req, res) => {
  let { id, name, type, price, isPremium, isAvailable } = req.body

  if (!name) {
    return res.status(400).json({ message: "Topping name is required" })
  }

  if (!id) {
    id = await uniqueIdFromName(name)
  }
  const avail = String(isAvailable ?? "true").toLowerCase() !== "false"
  if (avail && !req.file) {
    return res.status(400).json({ message: "Image is required for available toppings" })
  }
  let image = ""

  if (req.file) {
    // slugify topping name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const newFilename = `${slug}.webp`

    const oldPath = path.join(process.cwd(), "src/uploads/toppings", req.file.filename)
    const newPath = path.join(process.cwd(), "src/uploads/toppings", newFilename)

    await fs.rename(oldPath, newPath)


    image = `/uploads/toppings/${newFilename}`
  }

  const priceNum = Number(price) || 0
  const premiumBool = String(isPremium).toLowerCase() === "true"
  const availableBool = String(isAvailable ?? "true").toLowerCase() !== "false"
  try {
    const topping = await Topping.create({
      id,
      name,
      type,
      price: priceNum,
      isPremium: premiumBool,
      isAvailable: availableBool,
      image,
    })

    res.status(201).json(topping)
  } catch (err) {
    // DUPLICATE KEY (id or name)
    if (err.code === 11000) {
      // clean up uploaded file
      if (req.file) {
        try {
          await fs.unlink(path.join(process.cwd(), "src/uploads/toppings", req.file.filename))
        } catch (e) {
          if (e?.code !== "ENOENT") throw e
        }
      }

      return res.status(400).json({
        message: `There is already a topping with this id or name: ${id} / ${name}`,
      })
    }
    throw err
  }
})



// DELETE /api/toppings/:id
export const deleteTopping = asyncHandler(async (req, res) => {
  const { id } = req.params

  const topping = await Topping.findById(id)
  if (!topping) {
    return res.status(404).json({ message: "Topping not found" })
  }

  // attempt to delete uploaded image file (there should always be one)
  const img = String(topping.image || "")
  if (img.startsWith("/uploads/")) {
    const absPath = path.join(
      process.cwd(),
      "src",
      img.replace(/^\/uploads\//, "uploads/")
    )

    try {
      await fs.unlink(absPath)
    } catch (e) {
      if (e?.code !== "ENOENT") throw e
    }
  }


  await topping.deleteOne()

  res.json({ message: "Deleted", id })
})

// REDO /api/toppings/:id
export const redoToppingImage = asyncHandler(async (req, res) => {
  const { id } = req.params
  const topping = await Topping.findById(id)
  if (!topping) return res.status(404).json({ message: "Topping not found" })
  if (!req.file) return res.status(400).json({ message: "Image file required" })

  const img = String(topping.image || "")
  const uploadsDir = path.join(process.cwd(), "src/uploads/toppings")
  const tempPath = path.join(uploadsDir, req.file.filename)
  const isUploaded = img.startsWith("/uploads/toppings/")
  const isSprite = img.startsWith("/Sprites/Toppings/")

  if (!isUploaded && !isSprite) {
    return res.status(400).json({ message: "Unsupported image path" })
  }

  //decide target filename
  let targetFilename = ""
  let nextImagePath = ""

  if (isUploaded) {
    targetFilename = img.split("/").pop()
    nextImagePath = img
  } else {
    const safe = String(topping.id || topping._id || id)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    targetFilename = `${safe || "topping"}.webp`
    nextImagePath = `/uploads/toppings/${targetFilename}`
  }


  const targetPath = path.join(uploadsDir, targetFilename)

  //remove old target (if exists)
  try {
    await fs.unlink(targetPath)
  } catch (e) {
    if (e?.code !== "ENOENT") throw e
  }

  //move new upload into place
  await fs.rename(tempPath, targetPath)

  //if we changed from sprite->uploads, update DB
  if (topping.image !== nextImagePath) {
    topping.image = nextImagePath
    await topping.save()
  }

  res.json({ message: "Image replaced", image: topping.image })
})
