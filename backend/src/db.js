// db.js — robust mongodb connection helper
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not provided. Set environment variable MONGODB_URI.");
  // do not throw here — let caller decide. But we log loudly.
}

let isConnected = false;

/**
 * Connect with retry/backoff for production environment.
 * Returns a promise that resolves when connected.
 */
async function connect(retries = 0) {
  if (isConnected) return;
  if (!MONGODB_URI) throw new Error("MONGODB_URI not provided");

  // Use global mongoose options recommended for production
  mongoose.set("strictQuery", false);
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // keepAlive options
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000
    });
    isConnected = true;
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connect error:", err && err.message ? err.message : err);
    if (retries < 5) {
      const delay = 2000 * (retries + 1);
      console.log(`Retrying MongoDB connect in ${delay}ms (attempt ${retries + 1})`);
      await new Promise(r => setTimeout(r, delay));
      return connect(retries + 1);
    }
    throw err;
  }
}

module.exports = { connect, mongoose };
