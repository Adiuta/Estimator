// server.js — main entry (production & local friendly)
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const { connect } = require("./db");

// routes we'll mount
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/project");
// Note: public data endpoints below will use existing models
const Material = require("./models/Material");
const Tenaga = require("./models/Tenaga");
const Pekerjaan = require("./models/Pekerjaan");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect once at startup
(async () => {
  try {
    await connect();
    console.log("MongoDB Connected Successfully");
  } catch (err) {
    console.error("Fatal MongoDB connection error (startup):", err && err.message ? err.message : err);
    // don't exit process automatically; fail early but allow error logs to guide debugging
  }
})();

// Public read-only endpoints (used by frontend)
app.get("/api/materials", async (req, res) => {
  try {
    const data = await Material.find({}).lean();
    res.json(data);
  } catch (err) {
    console.error("GET /api/materials error:", err);
    res.status(500).json({ error: "Failed to load materials" });
  }
});

app.get("/api/tenaga", async (req, res) => {
  try {
    const data = await Tenaga.find({}).lean();
    res.json(data);
  } catch (err) {
    console.error("GET /api/tenaga error:", err);
    res.status(500).json({ error: "Failed to load tenaga" });
  }
});

app.get("/api/pekerjaan", async (req, res) => {
  try {
    const data = await Pekerjaan.find({}).lean();
    res.json(data);
  } catch (err) {
    console.error("GET /api/pekerjaan error:", err);
    res.status(500).json({ error: "Failed to load pekerjaan" });
  }
});

// mount auth & project routes
app.use("/api/auth", authRoutes);
app.use("/api/project", projectRoutes);

// Admin routes (we'll add later under /api/admin if needed)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend API running on port", PORT);
});
