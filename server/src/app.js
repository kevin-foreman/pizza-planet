import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from "./routes/authRoutes.js";
import pizzaRoutes from './routes/pizzaRoutes.js';
import toppingRoutes from './routes/toppingRoutes.js';
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