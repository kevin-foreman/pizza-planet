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



app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api/pizzas', pizzaRoutes);
app.use('/api/toppings', toppingRoutes);
app.use("/api/auth", authRoutes);
// app.use('/api/salads', saladRoutes);
// app.use('/api/calzones', calzoneRoutes);
// app.use('/api/orders', orderRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;