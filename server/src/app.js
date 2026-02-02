import express from "express"
import cors from "cors"
import morgan from "morgan"

import authRoutes from "./routes/authRoutes.js"
import pizzaRoutes from "./routes/pizzaRoutes.js"
import toppingRoutes from "./routes/toppingRoutes.js"
import checkoutRoutes from "./routes/checkoutRoutes.js"
import adminUsers from "./routes/adminUsersRoutes.js"
import shiftsRoutes from './routes/shiftsRoutes.js'
import archivedOrdersRoutes from "./routes/archivedOrdersRoutes.js"

import Pizza from "./models/Pizza.js"
import Topping from "./models/Topping.js"
import Salad from "./models/Salad.js"
import Calzone from "./models/Calzone.js"
import Pricing from "./models/Pricing.js"

import staffOrderRoutes from "./routes/staffOrderRoutes.js"
import customerOrderRoutes from "./routes/customerOrderRoutes.js"

import { notFoundHandler } from "./middleware/notFoundHandler.js"
import { errorHandler } from "./middleware/errorHandler.js"
/*For Image uploading for toppings*/
import path from "path"
import { fileURLToPath } from "url"
/*For Image deletion for toppings*/
import multer from "multer"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// this folder should match where multer writes


const app = express()

app.use(cors({origin:true,credentials:true}))
app.use(express.json())
app.use(morgan("dev"))

app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store")
  next()
})
app.use("/uploads", express.static(path.join(__dirname, "uploads")))
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message })
  }
  if (err) {
    return res.status(400).json({ message: err.message || "Upload failed" })
  }
  next()
})
app.get("/", (req, res) => {
  res.status(200).json({ message: "Pizza Planet API is running" })
})

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true })
})

app.get("/api/menu-test", (req, res) => {
  res.status(500).json({ message: "test error" })
})

app.get("/api/menu", async (req, res, next) => {
  try {
    const [pizzas, toppings, salads, calzones] = await Promise.all([
      Pizza.find({ isAvailable: true }).sort({ name: 1 }),
      Topping.find({ isAvailable: true }).sort({ name: 1 }),
      Salad.find({ isAvailable: true }).sort({ name: 1 }),
      Calzone.find({ isAvailable: true }).sort({ name: 1 }),
    ])
    res.json({
      toppings,
      entrees: [
        ...pizzas.map(p => ({ ...p.toObject(), kind: "pizza" })),
        ...salads.map(s => ({ ...s.toObject(), kind: "salad" })),
        ...calzones.map(c => ({ ...c.toObject(), kind: "calzone" })),
      ],
    })
  } catch (err) {
    next(err)
  }
})

app.get("/api/pricing", async (req, res) => {
  try {
    const doc = await Pricing.findOneAndUpdate(
      { key: "singleton" },
      {
        $setOnInsert: {
          key: "singleton",
          basePrice: 10.99,
          taxRate: 0.082,
          sizes: [
            { id: "sm", label: "Small", mult: 1, image: "/Sprites/Pizza/pizza_Sauce.webp" },
            { id: "md", label: "Medium", mult: 1.25, image: "/Sprites/Pizza/pizza_Sauce.webp" },
            { id: "lg", label: "Large", mult: 1.5, image: "/Sprites/Pizza/pizza_Sauce.webp" },
          ],

          crusts: [
            { id: "thin", label: "Thin", image: "/Sprites/Pizza/pizza_Thin_Base.webp" },
            { id: "hand", label: "Hand Tossed", image: "/Sprites/Pizza/pizza_Hand_Base.webp" },
            { id: "pan", label: "Pan", image: "/Sprites/Pizza/pizza_Pan_Base.webp" },
          ],
          sauces: [
            { id: "red", label: "Tomato", image: "/Sprites/Pizza/pizza_Red_Sauce.webp" },
            { id: "white", label: "White Sauce", image: "/Sprites/Pizza/pizza_White_Sauce.webp" },
            { id: "bbq", label: "BBQ", image: "/Sprites/Pizza/pizza_BBQ_Sauce.webp" },
          ],
        },
      },
      { new: true}
    ).lean()
    res.json(doc)
  } catch (e) {
    console.error("GET /api/pricing failed:", e)
    res.status(500).send(e?.message || String(e))
  }
})

app.put("/api/pricing", async (req, res) => {
  try {
    const payload = req.body
    const updated = await Pricing.findOneAndUpdate(
      { key: "singleton" },
      {
        $set: {
          basePrice: payload.basePrice,
          sizes: payload.sizes,
          crusts: payload.crusts,
          sauces: payload.sauces,
          toppings: payload.toppings,
          taxRate: payload.taxRate || 0,
        },
      },
      { new: true, upsert: true }
    ).lean()
    res.json(updated)
  } catch (e) {
    console.error("PUT /api/pricing failed:", e)
    res.status(500).send(e?.message || String(e))
  }
})

app.patch("/api/pricing", async (req, res) => {
  try {
    const payload = req.body
    const updated = await Pricing.findOneAndUpdate(
      { key: "singleton" },
      {
        $set: {
          basePrice: payload.basePrice,
          sizes: payload.sizes,
          crusts: payload.crusts,
          sauces: payload.sauces,
          toppings: payload.toppings,
          taxRate: payload.taxRate || 0,
        }
      },
      { new: true, upsert: true }
    ).lean()
    res.json(updated)
  } catch (e) {
    console.error("PATCH /api/pricing failed:", e)
    res.status(500).send(e?.message || String(e))
  }
})

app.use("/api", adminUsers)
app.use("/api/auth", authRoutes)
app.use("/api/pizzas", pizzaRoutes)
app.use("/api/toppings", toppingRoutes)
app.use("/api/orders", customerOrderRoutes)

app.use("/api/checkout", checkoutRoutes)
app.use('/api/shifts', shiftsRoutes)
app.use("/api/archived_orders", archivedOrdersRoutes)
app.use("/api/staff/orders", staffOrderRoutes)


app.use(notFoundHandler)
app.use(errorHandler)

export default app
