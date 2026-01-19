import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from "./routes/authRoutes.js";
import pizzaRoutes from './routes/pizzaRoutes.js';
import toppingRoutes from './routes/toppingRoutes.js';
import Pizza from './models/Pizza.js';
import Topping from './models/Topping.js';
import Salad from './models/Salad.js';
import Calzone from './models/Calzone.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import Pricing from './models/Pricing.js'
// import saladRoutes from './routes/saladRoutes.js';
// import calzoneRoutes from './routes/calzoneRoutes.js';
// import orderRoutes from './routes/orderRoutes.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173'
  })
); // Vite dev origin
app.use(express.json());
app.use(morgan('dev'));
// Small test routes
app.get("/", (req, res) => {
  res.status(200).json({ message: "Pizza Planet API is running" });
});
app.get('/api/menu-test', (req, res) => {
  res.status(500).json({ message: 'test error' })
})

app.get('/api/menu', async (req, res, next) => {
  try {
    const [pizzas, toppings, salads, calzones] = await Promise.all([
      Pizza.find({ isAvailable: true }).sort({ name: 1 }),
      Topping.find({ isAvailable: true }).sort({ name: 1 }),
      Salad.find({ isAvailable: true }).sort({ name: 1 }),
      Calzone.find({ isAvailable: true }).sort({ name: 1 })
    ])

    res.json({
      toppings,
      entrees: [
        ...pizzas.map(p => ({ ...p.toObject(), kind: 'pizza' })),
        ...salads.map(s => ({ ...s.toObject(), kind: 'salad' })),
        ...calzones.map(c => ({ ...c.toObject(), kind: 'calzone' }))
      ]
    })
  } catch (err) {
    next(err)
  }
})



app.get('/api/pricing', async (req, res) => {
  try {
    const doc = await Pricing.findOne().lean()
    if (!doc) {
      return res.status(404).json({ error: 'pricing doc missing' })
    }
    res.json(doc)
  } catch (e) {
    console.error('GET /api/pricing failed:', e)
    res.status(500).send(e?.stack || e?.message || String(e))
  }

})

app.patch('/api/pricing', async (req, res) => {
  try {
    const { basePrice, taxRate, sizes, crusts, sauces, toppings } = req.body || {}
    const updated = await Pricing.findOneAndUpdate(
      {},
      {
        $set: {
          ...(basePrice !== undefined ? { basePrice } : {}),
          ...(taxRate !== undefined ? { taxRate } : {}),
          ...(sizes !== undefined ? { sizes } : {}),
          ...(crusts !== undefined ? { crusts } : {}),
          ...(sauces !== undefined ? { sauces } : {}),
          ...(toppings !== undefined ? { toppings } : {}),
        }
      },
      { new: true, upsert: true }
    ).lean()
    res.json(updated)
  } catch (e) {
    console.error('PATCH /api/pricing failed:', e)
    res.status(500).send(e?.message || String(e))
  }
})


app.put('/api/pricing', async (req, res) => {
  try {
    const payload = req.body
    const updated = await Pricing.findOneAndUpdate(
      {},
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
    console.error('PUT /api/pricing failed:', e)
    res.status(500).send(e?.message || String(e))
  }
})


app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api/pizzas', pizzaRoutes);
app.use('/api/toppings', toppingRoutes);
app.use("/api/auth", authRoutes);
app.use('/api', checkoutRoutes);
// app.use('/api/salads', saladRoutes);
// app.use('/api/calzones', calzoneRoutes);
// app.use('/api/orders', orderRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;