import http from 'http';
import app from './app.js';
import { connectDB, mongoose } from "./config/db.js";

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectDB();

    // Optional: visibility into connection lifecycle
    mongoose.connection.on("disconnected", () => {
      console.error("⚠️ MongoDB disconnected");
    });
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB runtime error:", err?.message || err);
    });

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`Pizza Planet API listening on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down...`);
      server.close(async () => {
        try {
          await mongoose.connection.close(false);
          console.log("✅ Closed MongoDB connection");
        } catch (e) {
          console.error("❌ Error closing MongoDB connection:", e?.message || e);
        } finally {
          process.exit(0);
        }
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    process.on("unhandledRejection", (reason) => {
      console.error("❌ Unhandled Rejection:", reason);
      shutdown("unhandledRejection");
    });

    process.on("uncaughtException", (err) => {
      console.error("❌ Uncaught Exception:", err);
      shutdown("uncaughtException");
    });
  } catch (err) {
    // If DB connect fails, do not keep the server up in a half-broken state
    console.error("❌ Startup failed:", err?.message || err);
    process.exit(1);
  }
}

start();