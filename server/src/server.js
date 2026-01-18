import dotenv from "dotenv";
dotenv.config({ path: new URL("../.env", import.meta.url) });
import mongoose from "mongoose";
import app from "./app.js";

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ Missing MONGO_URI in server/.env");
  process.exit(1);
}

try {
  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB connected");

  app.listen(PORT, () => {
    console.log(`✅ API listening on http://localhost:${PORT}`);
  });
} catch (err) {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
}
