import express from "express"
import cors from "cors"
import morgan from "morgan"

import authRoutes from "./routes/authRoutes.js"
import pizzaRoutes from "./routes/pizzaRoutes.js"
import toppingRoutes from "./routes/toppingRoutes.js"
import checkoutRoutes from "./routes/checkoutRoutes.js"
import adminUsers from "./routes/adminUsersRoutes.js"
import shiftsRoutes from "./routes/shiftsRoutes.js"
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

import path from "path"
import { fileURLToPath } from "url"
import multer from "multer"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(morgan("dev"))

app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// IMPORTANT: mount /Sprites to the Sprites folder root, NOT /Pizza only
// so urls like /Sprites/Pizza/pizza_Thin_Base.webp resolve
app.use("/Sprites", express.static(path.join(__dirname, "../client/public/Sprites")))

// cache control for api
app.use("/api", (req, res, next) => {
   res.set("Cache-Control", "no-store")
   next()
})

// multer errors
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

function norm(v) {
   return String(v || "").toLowerCase().replace(/\s+/g, "").trim()
}

function fillImages(list, defaults) {
   const byKey = new Map()
   for (const d of defaults) {
      byKey.set(norm(d.id), d.image)
      byKey.set(norm(d.label), d.image)
   }

   let changed = false
   const next = (Array.isArray(list) ? list : []).map((x, i) => {
      const cur = String(x?.image || "").trim()
      if (cur) return x

      const hit =
         byKey.get(norm(x?.id)) ||
         byKey.get(norm(x?.label)) ||
         defaults[i]?.image ||
         ""

      if (!hit) return x
      changed = true
      return { ...x, image: hit }
   })

   return { next, changed }
}

app.get("/api/pricing", async (req, res) => {
   try {
      const DEFAULT_SIZES = [
         { id: "sm", label: "Small", mult: 1, image: "/Sprites/Pizza/pizza_Sauce.webp" },
         { id: "md", label: "Medium", mult: 1.25, image: "/Sprites/Pizza/pizza_Sauce.webp" },
         { id: "lg", label: "Large", mult: 1.5, image: "/Sprites/Pizza/pizza_Sauce.webp" },
      ]

      const DEFAULT_CRUSTS = [
         { id: "thin", label: "Thin", image: "/Sprites/Pizza/pizza_Thin_Base.webp" },
         { id: "hand", label: "Hand Tossed", image: "/Sprites/Pizza/pizza_Hand_Base.webp" },
         { id: "pan", label: "Pan", image: "/Sprites/Pizza/pizza_Pan_Base.webp" },
      ]

      const DEFAULT_SAUCES = [
         { id: "red", label: "Tomato", image: "/Sprites/Pizza/pizza_Red_Sauce.webp" },
         { id: "white", label: "White Sauce", image: "/Sprites/Pizza/pizza_White_Sauce.webp" },
         { id: "bbq", label: "BBQ", image: "/Sprites/Pizza/pizza_BBQ_Sauce.webp" },
      ]

      let doc = await Pricing.findOne({ key: "singleton" })
      if (!doc) {
         doc = await Pricing.create({
            key: "singleton",
            basePrice: 10.99,
            taxRate: 0.082,
            sizes: DEFAULT_SIZES,
            crusts: DEFAULT_CRUSTS,
            sauces: DEFAULT_SAUCES,
         })
         return res.json(doc.toObject())
      }

      let changed = false

      // if arrays are missing, restore defaults
      if (!Array.isArray(doc.sizes) || !doc.sizes.length) {
         doc.sizes = DEFAULT_SIZES
         changed = true
      }

      if (!Array.isArray(doc.crusts) || !doc.crusts.length) {
         doc.crusts = DEFAULT_CRUSTS
         changed = true
      }

      if (!Array.isArray(doc.sauces) || !doc.sauces.length) {
         doc.sauces = DEFAULT_SAUCES
         changed = true
      }

      // fill blank images without overwriting existing ones
      const cfix = fillImages(doc.crusts, DEFAULT_CRUSTS)
      if (cfix.changed) {
         doc.crusts = cfix.next
         doc.markModified("crusts")
         changed = true
      }

      const sfix = fillImages(doc.sauces, DEFAULT_SAUCES)
      if (sfix.changed) {
         doc.sauces = sfix.next
         doc.markModified("sauces")
         changed = true
      }

      // optional: sizes too (only if you want to backfill size images)
      const zfix = fillImages(doc.sizes, DEFAULT_SIZES)
      if (zfix.changed) {
         doc.sizes = zfix.next
         doc.markModified("sizes")
         changed = true
      }

      if (typeof doc.taxRate !== "number") {
         doc.taxRate = 0.082
         changed = true
      }

      if (changed) await doc.save()

      res.json(doc.toObject())
   } catch (e) {
      console.error("GET /api/pricing failed:", e)
      res.status(500).send(e?.message || String(e))
   }
})
app.post("/api/pricing/repair-images", async (req, res) => {
   try {
      const updated = await Pricing.findOneAndUpdate(
         { key: "singleton" },
         {
            $set: {
               "crusts.0.image": "/Sprites/Pizza/pizza_Thin_Base.webp",
               "crusts.1.image": "/Sprites/Pizza/pizza_Hand_Base.webp",
               "crusts.2.image": "/Sprites/Pizza/pizza_Pan_Base.webp",
               "sauces.0.image": "/Sprites/Pizza/pizza_Red_Sauce.webp",
               "sauces.1.image": "/Sprites/Pizza/pizza_White_Sauce.webp",
               "sauces.2.image": "/Sprites/Pizza/pizza_BBQ_Sauce.webp",
            }
         },
         { new: true }
      ).lean()
      res.json(updated)
   } catch (e) {
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
               taxRate: payload.taxRate || 0,
            },
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
app.use("/api/shifts", shiftsRoutes)
app.use("/api/archived_orders", archivedOrdersRoutes)
app.use("/api/staff/orders", staffOrderRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
